import { VNode } from '../../core/src/VNodes/VNode';
import JWEditor from '../../core/src/JWEditor';
import { ZoneIdentifier, ZoneNode } from './ZoneNode';

export type ComponentId = string;
export type LayoutEngineId = string;
export type DomZonePosition = 'after' | 'prepend' | 'append' | 'replace';

export interface ComponentDefinition {
    id: ComponentId;
    render: (editor: JWEditor) => Promise<VNode[]>;
}

export abstract class LayoutEngine {
    readonly id: LayoutEngineId;
    protected componentDefinitions: Record<ComponentId, ComponentDefinition> = {};
    protected componentZones: Record<ComponentId, ZoneIdentifier> = {};
    readonly root = new ZoneNode(['root']);

    components: Map<ComponentId, VNode[]> = new Map();

    constructor(public editor: JWEditor) {}

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Automatically intanciate the components in available zones.
     */
    async start(): Promise<void> {
        let allZones = [this.root, ...this.root.descendants(ZoneNode)];
        await this._fillZones(allZones);
        allZones = [this.root, ...this.root.descendants(ZoneNode)];
        if (!allZones.find(zone => zone.managedZones.includes('default'))) {
            // Add into the default zone if no valid zone could be found.
            throw new Error('Please define a "default" zone in your template.');
        }
    }
    /**
     * Hide all components.
     */
    async stop(): Promise<void> {
        for (const component of this.components.values()) {
            for (const node of component) {
                const zone = node.ancestor(ZoneNode);
                if (zone) {
                    zone.hide(node);
                }
            }
        }
        this.componentDefinitions = {};
        this.componentZones = {};
        this.components.clear();
        this.root.empty();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Load the given Component in this layout engine.
     *
     * @param componentDefinition
     */
    loadComponent(componentDefinition: ComponentDefinition): void {
        this.componentDefinitions[componentDefinition.id] = componentDefinition;
    }
    /**
     * Load component zones in this layout engine.
     *
     * @param componentZones
     */
    loadComponentZones(componentZones: Record<ComponentId, ZoneIdentifier>): void {
        Object.assign(this.componentZones, componentZones);
    }

    /**
     * Add the given node in the given zone if it exists. Otherwise, add it in
     * the default zone.
     * Return every created instance
     *
     * @param componentDefinition
     * @param zoneId
     */
    async add(componentId: ComponentId, zoneId: ZoneIdentifier): Promise<VNode[]> {
        const allZones = [this.root, ...this.root.descendants(ZoneNode)];
        let matchingZones = allZones.filter(node => node.managedZones.includes(zoneId));
        if (!matchingZones.length) {
            matchingZones = allZones.filter(zone => zone.managedZones.includes('default'));
        }
        const componentDefinition = this.componentDefinitions[componentId];
        const newComponents = await this._instantiateComponent(componentDefinition, matchingZones);
        return this._fillZones(newComponents);
    }
    /**
     *
     * Remove the component identified by the given reference from all zones.
     *
     * @param componentId
     */
    async remove(componentId: ComponentId): Promise<ZoneNode[]> {
        const components = this.components.get(componentId) || [];
        const zones: ZoneNode[] = [];
        let component: VNode;
        while ((component = components.pop())) {
            // Remove all instances in the zone children.
            for (const zone of component.descendants(ZoneNode)) {
                for (const child of zone.children()) {
                    zone.removeChild(child);
                    for (const component of this.components) {
                        const nodes = component[1];
                        if (nodes.includes(child)) {
                            nodes.splice(nodes.indexOf(child), 1);
                            break;
                        }
                    }
                }
            }
            // Remove the instance.
            const zone = component.ancestor(ZoneNode);
            if (zone && !zones.includes(zone)) {
                zones.push(zone);
            }
            component.remove();
        }
        return zones;
    }
    /**
     *
     * Show the components corresponding to given ref. Return the updated zones.
     *
     * @param componentId
     */
    async show(componentId: ComponentId): Promise<VNode[]> {
        const components = this.components.get(componentId);
        if (!components?.length) {
            console.warn('No component to show. Add it in a zone first.');
        }
        for (const component of components) {
            const zone = component.ancestor(ZoneNode);
            zone.show(component);
        }
        return components;
    }
    /**
     *
     * Hide the components corresponding to given ref. Return the updated zones.
     *
     * @param componentId
     */
    async hide(componentId: ComponentId): Promise<VNode[]> {
        const components = this.components.get(componentId) || [];
        for (const component of components) {
            const zone = component.ancestor(ZoneNode);
            zone.hide(component);
        }
        return components;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    private async _fillZones(nodes: VNode[]): Promise<VNode[]> {
        const newComponents: VNode[] = [];
        const stack = [...nodes];
        while (stack.length) {
            const node = stack.pop();
            const zones = node.descendants(ZoneNode);
            if (node instanceof ZoneNode) {
                zones.push(node);
            }

            for (const componentId in this.componentDefinitions) {
                const zoneId = this.componentZones[componentId];
                if (zoneId) {
                    const layoutComponent = this.componentDefinitions[componentId];
                    // Filter the zones corresponding to the given identifier.
                    let matchingZones = zones.filter(zone => zone.managedZones.includes(zoneId));
                    const components = this.components.get(componentId);
                    if (components) {
                        // Excluding the ones that are contained within the given node.
                        // avoid loop with child in itself.
                        matchingZones = matchingZones.filter(
                            zone => !zone.closest(ancestor => components.includes(ancestor)),
                        );
                    }
                    stack.push(
                        ...(await this._instantiateComponent(layoutComponent, matchingZones)),
                    );
                }
            }
            newComponents.push(node);
        }
        return newComponents;
    }
    private async _instantiateComponent(
        componentDefinition: ComponentDefinition,
        zones: ZoneNode[],
    ): Promise<VNode[]> {
        const components = this.components.get(componentDefinition.id) || [];
        // Add into the container.
        const newComponents: VNode[] = [];
        for (const zone of zones) {
            const nodes = await componentDefinition.render(this.editor);
            components.push(...nodes);
            newComponents.push(...nodes);
            zone.append(...nodes);
        }

        // Set the local reference.
        this.components.set(componentDefinition.id, components);

        // Return the components that were newly created.
        return newComponents;
    }
}
export type LayoutEngineConstructor = {
    new (editor: JWEditor): LayoutEngine;
};
