import { VNode } from '../../core/src/VNodes/VNode';
import { Modifier } from '../../core/src/Modifier';
import { ModifierRenderer } from './ModifierRenderer';
import { NodeRenderer } from './NodeRenderer';

export type ModifierId = number;
export type ModifierPairId = string;

export interface RenderingEngineWorker<T> {
    /**
     * Invalidate the first if the second is invalidated.
     *
     * If the given dependent is VNode or Modifier and the dependency is a
     * VNode or Modifier when the dependency is invalidated the dependent will
     * be invalidated.
     *
     * If the given dependent is VNode or Modifier and the dependency is a
     * rendering, when the rendering is invalidated every dependent will be
     * invalidated.
     *
     * If the given dependent is rendering when the VNode or Modifier is
     * invalidated the rendering will be invalidated.
     *
     * @param dependent
     * @param dependency
     */
    depends(dependent: VNode | Modifier, dependency: VNode | Modifier): void;
    depends(dependent: VNode | Modifier, dependency: T): void;
    depends(dependent: T, dependency: VNode | Modifier): void;
    depends(dependent: T | VNode | Modifier, dependency: T | VNode | Modifier): void;

    renderBatched(nodes: VNode[], rendered?: NodeRenderer<T>): Promise<void>[];
    getCompatibleRenderer(node: VNode, previousRenderer: NodeRenderer<T>): NodeRenderer<T>;
    getCompatibleModifierRenderer(
        modifier: Modifier,
        previousRenderer?: ModifierRenderer<T>,
    ): ModifierRenderer<T>;
    getRendering(node: VNode): T;
    locate(nodes: VNode[], value: T): void;
    render(nodes: VNode[]): Promise<T[]>;
}

export class RenderingEngineCache<T> {
    // Rendering created by a VNode.
    renderings = new Map<VNode, T>();
    // Promise resolved when the renderings is ready. We can have a value in renderings before the
    // promise is resolved but it's not the complete value (for eg: we create the node and an other
    // renderer add the attributes on this node)
    renderingPromises = new Map<VNode, Promise<void>>();

    // VNodes locations in a rendering (by default the rendering is equal to the location).
    locations = new Map<T, VNode[]>();
    // List of VNode and Modifiers linked to a rendering.
    // When the rendering is invalidated every VNode or Modifier will be invalidated.
    renderingDependent = new Map<T, Set<VNode | Modifier>>();
    // When the VNode or Modifier is invalidated every rendering will be invalidated.
    nodeDependent = new Map<VNode | Modifier, Set<T>>();
    // When the dependency is invalidated every dependents will be invalidated.
    linkedNodes = new Map<VNode | Modifier, Set<VNode | Modifier>>();

    // Cache for founded renderer.
    cachedCompatibleRenderer = new Map<VNode, Map<NodeRenderer<T>, NodeRenderer<T>>>();
    cachedCompatibleModifierRenderer = new Map<
        Modifier,
        Map<ModifierRenderer<T>, ModifierRenderer<T>>
    >();

    // Cache to compare modifiers.
    cachedModifierId = new Map<Modifier | void, ModifierId>();
    cachedIsSameAsModifier: Record<ModifierPairId, boolean> = {};
    // Used to invalidate the cachedIsSameAsModifier values.
    cachedIsSameAsModifierIds: Record<ModifierId, ModifierPairId[]> = {};

    // Worker send to renderers method 'render'.
    worker?: RenderingEngineWorker<T>;
}
