import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
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
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { VNode } from '../../core/src/VNodes/VNode';

export interface DomLayoutConfig extends JWPluginConfig {
    location?: [Node, DomZonePosition];
    locations?: [ComponentId, DomLayoutLocation][];
    components?: ComponentDefinition[];
    componentZones?: [ComponentId, ZoneIdentifier[]][];
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
        'commit': this._redraw,
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
        // This should only occurs when we receive an inferredKeydownEvent created from an InputEvent send by a mobile device.
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
            this.editor.nextEventMutex(() => {
                return this.editor.execCommand(command.commandId, params);
            });
            return command.commandId;
        }
    }

    /**
     * return True if target node is inside JB main editable Zone
     *
     * @param target: Node
     */
    isInEditable(target: Node): boolean {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
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
        // We cannot always expect a 'contentEditable' attribute on the main ancestor.
        // So we expect to find the main editor ZoneNode if we are in the editable part of JB
        return node && node.ancestor(ZoneNode)?.managedZones.includes('main');
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
    private async _redraw(): Promise<void> {
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        const changedPath = new Map<AbstractNode, string[][]>();
        const pathChanges = this.editor.memory.getChanges();
        for (const [object, path] of pathChanges) {
            if (object instanceof AbstractNode) {
                if (!changedPath.has(object)) {
                    changedPath.set(object, []);
                }
                changedPath.get(object).push(path);
            }
            for (const [parent, path] of this.editor.memory.getParents(object)) {
                if (parent instanceof AbstractNode) {
                    if (!changedPath.has(parent)) {
                        changedPath.set(parent, []);
                    }
                    changedPath.set(parent as VNode, path);
                }
            }
        }
        if (changedPath.size) {
            const nodes = [];
            for (const [root] of changedPath) {
                if (root === this.editor.selection.anchor || root === this.editor.selection.focus) {
                    // Filter not VNode changes and selection change.
                    changedPath.delete(root);
                }
            }
            let removedNode = false;
            for (const [root] of changedPath) {
                nodes.push(root);
                if (!root.parent) {
                    removedNode = true;
                }
            }
            if (removedNode) {
                // Need to force redrawing of children if remove a child.
                for (const [node, paths] of changedPath) {
                    if (paths.find(path => path[0] === 'childVNodes')) {
                        for (const child of node.childVNodes) {
                            const index = nodes.indexOf(child);
                            if (index !== -1) {
                                nodes.splice(index, 1);
                            }
                            nodes.push(child);
                        }
                    }
                }
            }
            await domLayoutEngine.redraw(nodes);
        }
    }
}
