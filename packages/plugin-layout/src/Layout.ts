import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import {
    LayoutEngine,
    ComponentDefinition,
    ComponentId,
    LayoutEngineConstructor,
    LayoutEngineId,
} from './LayoutEngine';
import { ZoneIdentifier } from './ZoneNode';

export interface LayoutConfig extends JWPluginConfig {
    components?: ComponentDefinition[];
    componentZones?: [ComponentId, ZoneIdentifier[]][];
}

export class Layout<T extends LayoutConfig = LayoutConfig> extends JWPlugin<T> {
    readonly engines: Record<LayoutEngineId, LayoutEngine> = {};
    readonly loaders = {
        layoutEngines: this.loadEngines,
        components: this.loadComponents,
        componentZones: this.loadComponentsZones,
    };
    commands = {
        show: {
            title: 'Show a layout component',
            handler: this.show.bind(this),
        },
        hide: {
            title: 'Hide a layout component',
            handler: this.hide.bind(this),
        },
    };

    async start(): Promise<void> {
        this.loadComponents(this.configuration.components || []);
        this.loadComponentsZones(this.configuration.componentZones || []);
    }
    /**
     * Prepend a Component in a zone.
     *
     * @param componentId
     * @param zoneId
     * @param props
     */
    async prepend(
        componentId: ComponentId,
        zoneId: ZoneIdentifier = 'default',
        props?: {},
    ): Promise<void> {
        const engines = Object.values(this.engines);
        await Promise.all(engines.map(engine => engine.prepend(componentId, zoneId, props)));
    }
    /**
     * Append a Component in a zone.
     *
     * @param componentId
     * @param zoneId
     */
    async append(
        componentId: ComponentId,
        zoneId: ZoneIdentifier = 'default',
        props?: {},
    ): Promise<void> {
        const engines = Object.values(this.engines);
        await Promise.all(engines.map(engine => engine.append(componentId, zoneId, props)));
    }
    /**
     * Clear a zone content.
     *
     * @param zoneId
     */
    async clear(zoneId: ZoneIdentifier): Promise<void> {
        const engines = Object.values(this.engines);
        await Promise.all(engines.map(engine => engine.clear(zoneId)));
    }
    /**
     * Remove a component (instance or clonse) from the zone.
     *
     * @param componentId
     * @param zoneId specifying a zone if it is necessary to remove the
     *      component from this zone only
     */
    async remove(componentId: ComponentId, zoneId?: ZoneIdentifier): Promise<void> {
        const promises = [];
        for (const layoutEngine of Object.values(this.engines)) {
            promises.push(layoutEngine.remove(componentId, zoneId));
        }
        await Promise.all(promises);
    }
    /**
     * Show component (instance or clonse) inside the zone.
     *
     * @param params
     */
    async show(params: { componentId: ComponentId }): Promise<void> {
        const promises = [];
        for (const layoutEngine of Object.values(this.engines)) {
            promises.push(layoutEngine.show(params.componentId));
        }
        await Promise.all(promises);
    }
    /**
     * Hide component (instance or clonse) inside the zone.
     *
     * @param params
     */
    async hide(params: { componentId: ComponentId }): Promise<void> {
        const promises = [];
        for (const layoutEngine of Object.values(this.engines)) {
            promises.push(layoutEngine.hide(params.componentId));
        }
        await Promise.all(promises);
    }

    /**
     * Load layout engines.
     *
     * @param layoutEngines
     */
    private loadEngines(layoutEngines: LayoutEngineConstructor[]): void {
        for (const EngineClass of layoutEngines) {
            const engine = new EngineClass(this.editor);
            if (this.engines[engine.constructor.id]) {
                throw new Error(`Rendering engine ${EngineClass.name} already registered.`);
            }
            this.engines[engine.constructor.id] = engine;
        }
    }
    /**
     * Load components into all layout engines.
     *
     * @param Components
     */
    private loadComponents(Components: ComponentDefinition[]): void {
        for (const Component of Components) {
            for (const layoutEngine of Object.values(this.engines)) {
                layoutEngine.loadComponent(Component);
            }
        }
    }
    /**
     * Load component zones into all layout engines.
     *
     * @param componentsZones
     */
    private loadComponentsZones(componentsZones: [ComponentId, ZoneIdentifier[]][]): void {
        const zones: Record<ComponentId, ZoneIdentifier[]> = {};
        for (const [id, zone] of componentsZones) {
            zones[id] = zone;
        }
        for (const layoutEngine of Object.values(this.engines)) {
            layoutEngine.loadComponentZones(zones);
        }
    }
}
