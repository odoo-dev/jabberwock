import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { JWEditor, Loadables, CommitParams, ExecutionContext } from '../../core/src/JWEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutLocation, DomLayoutEngine } from './DomLayoutEngine';
import {
    DomZonePosition,
    ComponentDefinition,
    ComponentId,
} from '../../plugin-layout/src/LayoutEngine';
import { DomObjectRenderer } from '../../plugin-renderer-dom-object/src/DomObjectRenderer';
import { ZoneDomObjectRenderer } from './ZoneDomObjectRenderer';
import { ZoneXmlDomParser } from './ZoneXmlDomParser';
import { LayoutContainerDomObjectRenderer } from './LayoutContainerDomObjectRenderer';
import { ZoneIdentifier, ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { CommandIdentifier } from '../../core/src/Dispatcher';
import { ActionableDomObjectRenderer } from './ActionableDomObjectRenderer';
import { ActionableGroupDomObjectRenderer } from './ActionableGroupDomObjectRenderer';
import { LabelDomObjectRenderer } from './LabelDomObjectRenderer';
import { SeparatorDomObjectRenderer } from './SeparatorDomObjectRenderer';
import { RuleProperty } from '../../core/src/Mode';
import { isContentEditable, nodeName, isInstanceOf } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';

const FocusAndBlurEvents = ['selectionchange', 'blur', 'focus', 'mousedown', 'touchstart'];

export interface DomLayoutConfig extends JWPluginConfig {
    location?: [Node, DomZonePosition];
    locations?: [ComponentId, DomLayoutLocation][];
    components?: ComponentDefinition[];
    componentZones?: [ComponentId, ZoneIdentifier[]][];
    pressedActionablesClassName?: string;
}

export class DomLayout<T extends DomLayoutConfig = DomLayoutConfig> extends JWPlugin<T> {
    static dependencies = [DomObjectRenderer, Parser, Renderer, Layout, Keymap];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        renderers: [
            ZoneDomObjectRenderer,
            LayoutContainerDomObjectRenderer,
            ActionableGroupDomObjectRenderer,
            ActionableDomObjectRenderer,
            LabelDomObjectRenderer,
            SeparatorDomObjectRenderer,
        ],
        parsers: [ZoneXmlDomParser],
        layoutEngines: [],
        components: [],
    };
    readonly loaders = {
        domLocations: this._loadComponentLocations,
    };
    commandHooks = {
        '@commit': this._redraw,
    };

    focusedNode: Node;
    private _debounce: number;

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        this.loadables.layoutEngines.push(DomLayoutEngine);
        this.processKeydown = this.processKeydown.bind(this);
        let debounceEvent: Event;
        const debouncedCheckFocusChanged = this._checkFocusChanged.bind(this);
        this._checkFocusChanged = (ev: Event): void => {
            if (debounceEvent && 'tagName' in debounceEvent.target) {
                return;
            }
            clearTimeout(this._debounce);
            debounceEvent = ev;
            this._debounce = setTimeout(() => {
                clearTimeout(this._debounce);
                debounceEvent = null;
                debouncedCheckFocusChanged(ev);
            });
        };
    }

    async start(): Promise<void> {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        FocusAndBlurEvents.forEach(eventName => {
            window.addEventListener(eventName, this._checkFocusChanged, true);
            window.addEventListener(eventName + '-iframe', this._checkFocusChanged, true);
        });
        for (const component of this.configuration.components || []) {
            domLayoutEngine.loadComponent(component);
        }
        const zones: Record<ComponentId, ZoneIdentifier[]> = {};
        for (const [id, zone] of this.configuration.componentZones || []) {
            zones[id] = zone;
        }
        domLayoutEngine.loadComponentZones(zones);
        this._loadComponentLocations(this.configuration.locations || []);
        domLayoutEngine.location = this.configuration.location;
        await domLayoutEngine.start();
        window.addEventListener('keydown', this.processKeydown, true);
        window.addEventListener('keydown-iframe', this.processKeydown, true);
    }
    async stop(): Promise<void> {
        clearTimeout(this._debounce);
        FocusAndBlurEvents.forEach(eventName => {
            window.removeEventListener(eventName, this._checkFocusChanged, true);
            window.removeEventListener(eventName + '-iframe', this._checkFocusChanged, true);
        });
        window.removeEventListener('keydown', this.processKeydown, true);
        window.removeEventListener('keydown-iframe', this.processKeydown, true);
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom;
        await domLayoutEngine.stop();
        return super.stop();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * KeyboardEvent listener to be added to the DOM that calls `execCommand` if
     * the keys pressed match one of the shortcut registered in the keymap.
     *
     * @param event
     */
    async processKeydown(
        event: KeyboardEvent,
        processingContext: ExecutionContext = this.editor,
    ): Promise<CommandIdentifier> {
        if (
            this.focusedNode &&
            ['INPUT', 'SELECT', 'TEXTAREA'].includes(nodeName(this.focusedNode))
        ) {
            // Don't process if use write into an input, select or textarea.
            return;
        }
        // If target == null we bypass the editable zone check.
        // This should only occurs when we receive an inferredKeydownEvent
        // created from an InputEvent send by a mobile device.
        if (!this.focusedNode && event.target && !this.isInEditable(event.target as Node)) {
            // Don't process keydown if the user is outside the current editor editable Zone and
            // the current event does not target an editable node (for testing or external methods
            // and library).
            return;
        }
        const keymap = this.dependencies.get(Keymap);
        const commands = keymap.match(event);
        const [command, context] = this.editor.contextManager.match(commands);

        if (command && command.commandId) {
            const params = { context, ...command.commandArgs };
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            await Promise.all([
                this.editor.dispatcher.dispatch('@preKeydownCommand', {}),
                processingContext.execCommand(command.commandId, params),
            ]);
            return command.commandId;
        }
    }

    /**
     * Return true if the target node is inside Jabberwock's main editable Zone
     * and within an editable context.
     *
     * @param target
     */
    isInEditable(target: Node): boolean {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        target = this._getDeepestTarget(target);
        let nodes = domLayoutEngine.getNodes(target);
        while (!nodes.length && target) {
            if (target.previousSibling) {
                target = target.previousSibling;
            } else {
                target = target.parentNode;
            }
            nodes = domLayoutEngine.getNodes(target);
        }
        const node = nodes?.pop();
        // We cannot always expect a 'contentEditable' attribute on the main
        // ancestor. So we expect to find the main editor ZoneNode if we are in
        // the editable part of Jabberwock.
        return (
            node &&
            this.editor.isInEditable(node) &&
            !!node.ancestor(node => node instanceof ZoneNode && node.managedZones.includes('main'))
        );
    }

    /**
     * Return true if the target node is inside a Jabberwock's editor componant.
     *
     * @param target: Node
     */
    isInEditor(target: Node): boolean {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        target = this._getDeepestTarget(target);
        return !!domLayoutEngine.getNodes(target)?.length;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    private _loadComponentLocations(locations: [ComponentId, DomLayoutLocation][]): void {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        for (const [id, location] of locations) {
            domLayoutEngine.locations[id] = location;
        }
    }
    /**
     * Return the deepest target, based on the given target and the current
     * selection. The selection can be used only if it is indeed contained
     * within the target.
     *
     * @param target
     */
    private _getDeepestTarget(target: Node): Node {
        const selection = target.ownerDocument?.getSelection();
        const anchorNode = selection?.anchorNode;
        let node = anchorNode;
        let isAnchorDescendantOfTarget = false;
        while (node) {
            if (node === target) {
                isAnchorDescendantOfTarget = true;
                break;
            }
            node = node.parentElement;
        }
        return isAnchorDescendantOfTarget ? anchorNode : target;
    }
    private async _redraw(params: CommitParams): Promise<void> {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        await domLayoutEngine.redraw(params.changesLocations);
    }
    private _checkFocusChanged(ev: UIEvent): void {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        let focus: Node;

        let iframe: HTMLIFrameElement;
        if (isInstanceOf(document.activeElement, HTMLIFrameElement)) {
            iframe = document.activeElement;
        } else if (isInstanceOf(ev.target, HTMLIFrameElement)) {
            iframe = ev.target;
        }

        let root: ShadowRoot | Document = document;
        if (isInstanceOf(ev.target, Element) && ev.target.shadowRoot) {
            root = ev.target.shadowRoot;
        }

        if (iframe) {
            const iframeDoc = iframe.contentDocument;
            const domSelection = iframeDoc.getSelection();
            if (isInstanceOf(domSelection.anchorNode, HTMLBodyElement)) {
                if (domSelection.anchorNode.contains(this.focusedNode)) {
                    // On chrome, when the user  mousedown and grow the selection,
                    // then value of getSelection() doesn't change. We keep the
                    // previous selection if it's inside the current iframe.
                    focus = this.focusedNode;
                } else if (domLayoutEngine.getNodes(iframe).length) {
                    focus = iframe;
                }
            } else if (domLayoutEngine.getNodes(domSelection.anchorNode).length) {
                focus = domSelection.anchorNode;
            } else if (domLayoutEngine.getNodes(iframeDoc.activeElement).length) {
                focus = iframeDoc.activeElement;
            } else if (domLayoutEngine.getNodes(iframe).length) {
                focus = iframeDoc.activeElement;
            }
        } else {
            const domSelection = root.getSelection
                ? root.getSelection()
                : root.ownerDocument.getSelection();
            if (ev.type === 'selectionchange' && !domSelection.anchorNode) {
                // When the dom are redrawed, the selection can be removed, it's not a blur/focus.
                return;
            }
            let ancestor = domSelection.anchorNode;
            while (
                ancestor &&
                ancestor.parentNode &&
                ancestor !== document.activeElement &&
                ancestor !== root.activeElement
            ) {
                if (isInstanceOf(ancestor.parentNode, ShadowRoot)) {
                    ancestor = ancestor.parentNode.host;
                } else if (isInstanceOf(ancestor.parentNode, Document)) {
                    ancestor = ancestor.parentNode.defaultView.frameElement;
                } else {
                    ancestor = ancestor.parentNode;
                }
            }
            if (
                (ancestor === root.activeElement || ancestor === document.activeElement) &&
                domLayoutEngine.getNodes(domSelection.anchorNode).length
            ) {
                focus = domSelection.anchorNode;
            } else if (domLayoutEngine.getNodes(document.activeElement).length) {
                focus = document.activeElement;
            } else if (ev.target && domLayoutEngine.getNodes(ev.target as Node).length) {
                focus = ev.target as Node;
            }
        }

        if (focus && !this.focusedNode) {
            this.editor.dispatcher.dispatch('@focus');
        } else if (!focus && this.focusedNode) {
            this.editor.dispatcher.dispatch('@blur');
        }
        this.focusedNode = focus;
    }
}
