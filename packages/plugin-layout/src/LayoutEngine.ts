import { VNode } from '../../core/src/VNodes/VNode';
import JWEditor from '../../core/src/JWEditor';
import { ZoneIdentifier, ZoneNode } from './ZoneNode';
import { VersionableArray } from '../../core/src/Memory/VersionableArray';
import { VersionableObject } from '../../core/src/Memory/VersionableObject';

export type ComponentId = string;
export type LayoutEngineId = string;
export type DomZonePosition = 'after' | 'prepend' | 'append' | 'replace';

export interface ComponentDefinition {
    id: ComponentId;
    render: (editor: JWEditor, props?: {}) => Promise<VNode[]>;
}

export abstract class LayoutEngine {
    static readonly id: LayoutEngineId;
    protected componentDefinitions: Record<ComponentId, ComponentDefinition> = {};
    protected componentZones: Record<ComponentId, ZoneIdentifier[]> = {};
    readonly root = new ZoneNode({ managedZones: ['root'] });

    components = new VersionableObject() as Record<ComponentId, VNode[]>;

    constructor(public editor: JWEditor) {}

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Automatically intanciate the components in available zones.
     */
    async start(): Promise<void> {
        let allZones = [this.root, ...this.root.descendants(ZoneNode)];
        await this.fillZones(allZones);
        allZones = [this.root, ...this.root.descendants(ZoneNode)];
        if (!allZones.find(zone => zone.managedZones.includes('default'))) {
            // Add into the default zone if no valid zone could be found.
            throw new Error('Please define a "default" zone in your template.');
        }
        this.editor.memory.attach(this.root);
        this.editor.memory.attach(this.components);
    }
    /**
     * Hide all components.
     */
    async stop(): Promise<void> {
        for (const id in this.components) {
            for (const node of this.components[id]) {
                const zone = node.ancestor(ZoneNode);
                if (zone) {
                    zone.hide(node);
                }
            }
        }
        this.componentDefinitions = {};
        this.componentZones = {};
        this.components = {};
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
    loadComponentZones(componentZones: Record<ComponentId, ZoneIdentifier[]>): void {
        Object.assign(this.componentZones, componentZones);
    }

    /**
     * Prepend the given node in the given zone if it exists. Otherwise, add it in
     * the default zone.
     * Return every created instance
     *
     * @param componentId
     * @param zoneId
     * @param props
     */
    async prepend(componentId: ComponentId, zoneId: ZoneIdentifier, props?: {}): Promise<VNode[]> {
        const allZones = [this.root, ...this.root.descendants(ZoneNode)];
        let matchingZones = allZones.filter(node => node.managedZones.includes(zoneId));
        if (!matchingZones.length) {
            matchingZones = allZones.filter(zone => zone.managedZones.includes('default'));
        }
        const componentDefinition = this.componentDefinitions[componentId];
        const newComponents = await this._instantiateComponent(
            componentDefinition,
            matchingZones,
            props,
            true,
        );
        return this.fillZones(newComponents);
    }
    /**
     * Append the given node in the given zone if it exists. Otherwise, add it in
     * the default zone.
     * Return every created instance
     *
     * @param componentDefinition
     * @param zoneId
     */
    async append(componentId: ComponentId, zoneId: ZoneIdentifier, props?: {}): Promise<VNode[]> {
        const allZones = [this.root, ...this.root.descendants(ZoneNode)];
        let matchingZones = allZones.filter(node => node.managedZones.includes(zoneId));
        if (!matchingZones.length) {
            matchingZones = allZones.filter(zone => zone.managedZones.includes('default'));
        }
        const componentDefinition = this.componentDefinitions[componentId];
        const newComponents = await this._instantiateComponent(
            componentDefinition,
            matchingZones,
            props,
        );
        return this.fillZones(newComponents);
    }
    /**
     *
     * Remove the component identified by the given reference from all zones.
     *
     * @param componentId
     * @param zoneId specifying a zone if it is necessary to remove the
     *      component from this zone only
     */
    async remove(componentId: ComponentId, zoneId?: ZoneIdentifier): Promise<ZoneNode[]> {
        const components = [...(this.components[componentId] || [])];
        const zones: ZoneNode[] = [];
        let component: VNode;
        while ((component = components.pop())) {
            // filter by zone if needed
            if (
                !zoneId ||
                component.ancestor(
                    ancestor =>
                        ancestor instanceof ZoneNode && ancestor.managedZones.includes(zoneId),
                )
            ) {
                // Remove all instances in the zone children.
                this._clear(component);
                // Remove the instance.
                const zone = component.ancestor(ZoneNode);
                if (zone && !zones.includes(zone)) {
                    zones.push(zone);
                }
                component.remove();
            }
        }
        return zones;
    }
    async clear(zoneId: ZoneIdentifier): Promise<ZoneNode[]> {
        const zones = this.root
            .descendants(ZoneNode)
            .filter(zone => zone.managedZones.includes(zoneId));
        for (const zone of zones) {
            this._clear(zone);
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
        const components = this.components[componentId];
        if (!components?.length) {
            console.warn('No component to show. Prepend or append it in a zone first.');
        } else {
            for (const component of components) {
                const zone = component.ancestor(ZoneNode);
                zone.show(component);
            }
        }
        return components || [];
    }
    /**
     *
     * Hide the components corresponding to given ref. Return the updated zones.
     *
     * @param componentId
     */
    async hide(componentId: ComponentId): Promise<VNode[]> {
        const components = this.components[componentId];
        if (!components?.length) {
            console.warn('No component to hide. Prepend or append it in a zone first.');
        } else {
            for (const component of components) {
                const zone = component.ancestor(ZoneNode);
                zone.hide(component);
            }
        }
        return components || [];
    }
    /**
     * Check if the string is a zone id where at leat one component will be
     * automatically added.
     *
     * @param zoneId
     */
    hasConfiguredComponents(zoneId: string): boolean {
        // Check the zone list.
        for (const componentId in this.componentZones) {
            if (this.componentZones[componentId]?.includes(zoneId)) {
                return true;
            }
        }
        // The components all have at least one zone equal to their id.
        return !!this.componentDefinitions[zoneId];
    }
    /**
     * Search into this new nodes if they are some ZoneNode and automatically
     * fill it by the components which match with this zones.
     *
     * @param nodes
     */
    async fillZones(nodes: VNode[]): Promise<VNode[]> {
        const newComponents: VNode[] = [];
        const stack = [...nodes];
        while (stack.length) {
            const node = stack.pop();
            const zones = node.descendants(ZoneNode);
            if (node instanceof ZoneNode) {
                zones.push(node);
            }

            for (const componentId in this.componentDefinitions) {
                const zoneIds = this.componentZones[componentId];
                const layoutComponent = this.componentDefinitions[componentId];
                // Filter the zones corresponding to the given identifier.
                let matchingZones = zones.filter(
                    zone =>
                        (zoneIds && zone.managedZones.find(zoneId => zoneIds.includes(zoneId))) ||
                        zone.managedZones.includes(componentId),
                );
                const components = this.components[componentId];
                if (components) {
                    // Excluding the ones that are contained within the given node.
                    // Avoid loop with child in itself.
                    matchingZones = matchingZones.filter(
                        zone => !zone.closest(ancestor => components.includes(ancestor)),
                    );
                }
                if (matchingZones.length) {
                    stack.push(
                        ...(await this._instantiateComponent(layoutComponent, matchingZones)),
                    );
                }
            }
            newComponents.push(node);
        }
        return newComponents;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    private async _instantiateComponent(
        componentDefinition: ComponentDefinition,
        zones: ZoneNode[],
        props?: {},
        prepend = false,
    ): Promise<VNode[]> {
        let components = this.components[componentDefinition.id];
        if (!components) {
            // Set the local reference.
            components = new VersionableArray();
            this.components[componentDefinition.id] = components;
        }
        // Add into the container.
        const newComponents: VNode[] = [];
        for (const zone of zones) {
            const nodes = await componentDefinition.render(this.editor, props);
            components.push(...nodes);
            newComponents.push(...nodes);
            if (prepend) {
                zone.prepend(...nodes);
            } else {
                zone.append(...nodes);
            }
        }
        // Return the components that were newly created.
        return newComponents;
    }
    private _clear(component: VNode): void {
        const zones = component.descendants(ZoneNode);
        if (component instanceof ZoneNode) {
            zones.push(component);
        }
        for (const zone of zones) {
            for (const child of zone.childVNodes) {
                zone.removeChild(child);
                for (const id in this.components) {
                    const nodes = this.components[id];
                    if (nodes.includes(child)) {
                        nodes.splice(nodes.indexOf(child), 1);
                        break;
                    }
                }
            }
        }
    }
}
export interface LayoutEngine {
    constructor: LayoutEngineConstructor & {
        id: LayoutEngineId;
    };
}
export type LayoutEngineConstructor = {
    new (editor: JWEditor): LayoutEngine;
};
