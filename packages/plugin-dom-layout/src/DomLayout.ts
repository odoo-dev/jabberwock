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
import { Html } from '../../plugin-html/src/Html';
import { ZoneDomObjectRenderer } from './ZoneDomObjectRenderer';
import { ZoneXmlDomParser } from './ZoneXmlDomParser';
import { LayoutContainerDomObjectRenderer } from './LayoutContainerDomObjectRenderer';
import { ZoneIdentifier } from '../../plugin-layout/src/ZoneNode';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { CommandIdentifier } from '../../core/src/Dispatcher';
import { ActionableDomObjectRenderer } from './ActionableDomObjectRenderer';
import { ActionableGroupDomObjectRenderer } from './ActionableGroupDomObjectRenderer';
import { ActionableGroupSelectItemDomObjectRenderer } from './ActionableGroupSelectItemDomObjectRenderer';
import { LabelDomObjectRenderer } from './LabelDomObjectRenderer';
import { SeparatorDomObjectRenderer } from './SeparatorDomObjectRenderer';

export interface DomLayoutConfig extends JWPluginConfig {
    location?: [Node, DomZonePosition];
    locations?: [ComponentId, DomLayoutLocation][];
    components?: ComponentDefinition[];
    componentZones?: [ComponentId, ZoneIdentifier][];
    afterRender?: Function;
}

export class DomLayout<T extends DomLayoutConfig = DomLayoutConfig> extends JWPlugin<T> {
    static dependencies = [Html, Parser, Renderer, Layout, Keymap];
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
        '*': this.redraw,
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
        const zones: Record<ComponentId, ZoneIdentifier> = {};
        for (const [id, zone] of this.configuration.componentZones || []) {
            zones[id] = zone;
        }
        domLayoutEngine.loadComponentZones(zones);
        this._loadComponentLocations(this.configuration.locations || []);
        domLayoutEngine.location = this.configuration.location;
        await domLayoutEngine.start();
        if (this.configuration.afterRender) {
            await this.configuration.afterRender();
        }
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
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;

        if (event.target && !domLayoutEngine.getNodes(event.target as Node).length) {
            // Don't process keydown if the user is outside the current editor
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

    async redraw(): Promise<void> {
        // TODO update this method to use JSON renderer feature (update also show, hide, add, remove)
        const layout = this.dependencies.get(Layout);
        const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
        const editables = domLayoutEngine.components.get('editable');
        if (editables?.length) {
            await domLayoutEngine.redraw(editables[0]);
            await this.configuration.afterRender?.();
        }
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
}
