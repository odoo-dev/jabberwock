import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { JWEditor, Loadables, CommitParams } from '../../core/src/JWEditor';
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
import { ActionableGroupSelectItemDomObjectRenderer } from './ActionableGroupSelectItemDomObjectRenderer';
import { LabelDomObjectRenderer } from './LabelDomObjectRenderer';
import { SeparatorDomObjectRenderer } from './SeparatorDomObjectRenderer';
import { RuleProperty } from '../../core/src/Mode';
import { isContentEditable } from '../../utils/src/utils';

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
            ActionableGroupSelectItemDomObjectRenderer,
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

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        this.loadables.layoutEngines.push(DomLayoutEngine);
        this.processKeydown = this.processKeydown.bind(this);
    }

    async start(): Promise<void> {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
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
    }
    async stop(): Promise<void> {
        window.removeEventListener('keydown', this.processKeydown, true);
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
    async processKeydown(event: KeyboardEvent): Promise<CommandIdentifier> {
        // If target == null we bypass the editable zone check.
        // This should only occurs when we receive an inferredKeydownEvent
        // created from an InputEvent send by a mobile device.
        if (event.target && !this.isInEditable(event.target as Node)) {
            // Don't process keydown if the user is outside the current editor editable Zone.
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
            await this.editor.execCommand(command.commandId, params);
            return command.commandId;
        }
    }

    /**
     * Return true if the target node is inside Jabberwock's main editable Zone.
     *
     * @param target: Node
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
            (isContentEditable(node) || this.editor.mode.is(node, RuleProperty.EDITABLE)) &&
            !!node.ancestor(node => node instanceof ZoneNode && node.managedZones.includes('main'))
        );
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
}
