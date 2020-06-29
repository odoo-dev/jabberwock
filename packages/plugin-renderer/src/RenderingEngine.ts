import { VNode } from '../../core/src/VNodes/VNode';
import { isConstructor } from '../../utils/src/utils';
import JWEditor from '../../core/src/JWEditor';
import { Modifier } from '../../core/src/Modifier';
import { ModifierRenderer, ModifierRendererConstructor } from './ModifierRenderer';
import { NodeRenderer, RendererConstructor } from './NodeRenderer';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { RenderingEngineCache, ModifierPairId } from './RenderingEngineCache';

export type RenderingIdentifier = string;

let modifierId = 0;

export class RenderingEngine<T = {}> {
    static readonly id: RenderingIdentifier;
    static readonly extends: RenderingIdentifier[] = [];
    static readonly defaultRenderer: RendererConstructor;
    static readonly defaultModifierRenderer: ModifierRendererConstructor;
    readonly editor: JWEditor;
    readonly renderers: NodeRenderer<T>[] = [];
    readonly modifierRenderers: ModifierRenderer<T>[] = [];

    constructor(editor: JWEditor) {
        this.editor = editor;
        const defaultRenderer = new this.constructor.defaultRenderer(this);
        if (defaultRenderer.predicate) {
            throw new Error(`Default renderer cannot have a predicate.`);
        } else {
            this.renderers.push(defaultRenderer);
        }
        const defaultModifierRenderer = new this.constructor.defaultModifierRenderer(this);
        if (defaultModifierRenderer.predicate) {
            throw new Error(`Default renderer cannot have a predicate.`);
        } else {
            this.modifierRenderers.push(defaultModifierRenderer);
        }
    }
    /**
     * Register the given renderer by instantiating it with this rendering
     * engine. The renderer constructor will receive a special second parameter
     * which is a magic renderer whose `render` method will call the next
     * compatible renderer in line for the given node.
     *
     * @param RendererClass
     */
    register(RendererClass: RendererConstructor<T> | ModifierRendererConstructor<T>): void {
        // Both input parameter types have the same features with respect to
        // what we are doing in this function. However, Typescript requires a
        // stronger typing for inserting them into an array. We chose to use a
        // blind, somewhat wrong, typecast to reduce the scope of the types
        // in order to avoid duplicating the logic of this function.
        const renderers = (isConstructor(RendererClass, NodeRenderer)
            ? this.renderers
            : this.modifierRenderers) as NodeRenderer<T>[];
        RendererClass = RendererClass as RendererConstructor<T>;

        if (RendererClass.id === this.constructor.id) {
            renderers.unshift(new RendererClass(this));
        } else {
            const supportedTypes = [this.constructor.id, ...this.constructor.extends];
            const priorRendererIds = supportedTypes.slice(
                0,
                supportedTypes.indexOf(RendererClass.id),
            );
            const postRendererIndex = renderers.findIndex(
                parser => !priorRendererIds.includes(parser.constructor.id),
            );
            renderers.splice(postRendererIndex, 0, new RendererClass(this));
        }
    }
    /**
     * Render the given node. If a prior rendering already exists for this node
     * in this run, return it directly.
     * The cache are automaticaly invalidate if the nodes are not linked to the
     * memory (linked to a layout root for eg)
     *
     * @param nodes
     */
    async render(
        nodes: VNode[],
        cache?: RenderingEngineCache<T>,
        optimizeModifiersRendering?: boolean,
    ): Promise<RenderingEngineCache<T>> {
        if (!cache) {
            cache = new RenderingEngineCache(this);
        }
        if (typeof optimizeModifiersRendering === 'boolean') {
            cache.optimizeModifiersRendering = optimizeModifiersRendering;
        }

        const promises = this.renderBatched(
            cache,
            nodes.filter(node => !cache.renderingPromises.get(node)),
        );
        await Promise.all(promises); // wait the newest promises
        await Promise.all(nodes.map(node => cache.renderingPromises.get(node))); // wait indifidual promise
        return cache;
    }
    /**
     * Indicates the location of the nodes in the rendering performed.
     *
     * For example, if you avec a 2 charNodes (X, Y) seperate by a linebreak
     * but, you want to display one text node, you can have a text node equal
     * to 'x_y' and indicate that it's [charNode, LineBreak, CharNode].
     * Or you want to display the Linebreak twice: 'x_y_' and indicate this
     * [charNode, LineBreak, CharNode, LineBreak]
     *
     * @param nodes
     * @param rendering
     */
    locate(cache: RenderingEngineCache<T>, nodes: VNode[], value: T): void {
        cache.locations.set(value, nodes);
    }
    /**
     * Group the nodes and call the renderer 'renderBatch' method with the
     * different groups of nodes. By default each group is composed with only
     * one node.
     * The indices of the DomObject list match the indices of the given nodes
     * list.
     *
     * @see renderBatch
     *
     * @param nodes
     * @param rendered
     */
    renderBatched(
        cache: RenderingEngineCache<T>,
        nodes: VNode[],
        rendered?: NodeRenderer<T>,
    ): Promise<void>[] {
        const promises: Promise<void>[] = [];
        for (const node of nodes) {
            const renderer = cache.worker.getCompatibleRenderer(node, rendered);
            const renderings = renderer.renderBatch(nodes, cache.worker);
            const promise = renderings.then(values => {
                const value = values[0];
                this.depends(cache, node, value);
                this.depends(cache, value, node);
                this._addDefaultLocation(cache, node, value);
                cache.renderings.set(node, value);
            });
            cache.renderingPromises.set(node, promise);
            promises.push(promise);
        }
        return promises;
    }
    /**
     * Return the the first matching Renderer for this VNode, starting from the
     * previous renderer.
     *
     * @param node
     * @param previousRenderer
     */
    getCompatibleRenderer(
        cache: RenderingEngineCache<T>,
        node: VNode,
        previousRenderer: NodeRenderer<T>,
    ): NodeRenderer<T> {
        let cacheCompatible = cache.cachedCompatibleRenderer.get(node);
        if (!cacheCompatible) {
            cacheCompatible = new Map();
            cache.cachedCompatibleRenderer.set(node, cacheCompatible);
        } else if (cacheCompatible.get(previousRenderer)) {
            return cacheCompatible.get(previousRenderer);
        }
        let nextRendererIndex = this.renderers.indexOf(previousRenderer) + 1;
        let nextRenderer: NodeRenderer<T>;
        do {
            nextRenderer = this.renderers[nextRendererIndex];
            nextRendererIndex++;
        } while (nextRenderer && !node.test(nextRenderer.predicate));
        cacheCompatible.set(previousRenderer, nextRenderer);
        return nextRenderer;
    }
    /**
     * Return the the first matching Renderer for this VNode, starting from the
     * previous renderer.
     *
     * @param node
     * @param previousRenderer
     */
    getCompatibleModifierRenderer(
        cache: RenderingEngineCache<T>,
        modifier: Modifier,
        previousRenderer?: ModifierRenderer<T>,
    ): ModifierRenderer<T> {
        let cacheCompatible = cache.cachedCompatibleModifierRenderer.get(modifier);
        if (!cacheCompatible) {
            cacheCompatible = new Map();
            cache.cachedCompatibleModifierRenderer.set(modifier, cacheCompatible);
        } else if (cacheCompatible.get(previousRenderer)) {
            return cacheCompatible.get(previousRenderer);
        }

        let nextRendererIndex = this.modifierRenderers.indexOf(previousRenderer) + 1;
        let nextRenderer: ModifierRenderer<T>;
        do {
            nextRenderer = this.modifierRenderers[nextRendererIndex];
            nextRendererIndex++;
        } while (
            nextRenderer.predicate &&
            !(isConstructor(nextRenderer.predicate, Modifier)
                ? modifier instanceof nextRenderer.predicate
                : nextRenderer.predicate(modifier))
        );
        cacheCompatible.set(previousRenderer, nextRenderer);
        return nextRenderer;
    }
    depends(
        cache: RenderingEngineCache<T>,
        dependent: T | VNode | Modifier,
        dependency: T | VNode | Modifier,
    ): void {
        let dNode: VNode | Modifier;
        let dRendering: T;
        let dyNode: VNode | Modifier;
        let dyRendering: T;
        if (dependent instanceof AbstractNode || dependent instanceof Modifier) {
            dNode = dependent;
        } else {
            dRendering = dependent;
        }
        if (dependency instanceof AbstractNode || dependency instanceof Modifier) {
            dyNode = dependency;
        } else {
            dyRendering = dependency;
        }

        if (dNode) {
            if (dyNode) {
                const linked = cache.linkedNodes.get(dyNode);
                if (linked) {
                    linked.add(dNode);
                } else {
                    cache.linkedNodes.set(dyNode, new Set([dNode]));
                }
            } else {
                const from = cache.renderingDependent.get(dyRendering);
                if (from) {
                    from.add(dNode);
                } else {
                    cache.renderingDependent.set(dyRendering, new Set([dNode]));
                }
            }
        } else if (dyNode) {
            const linked = cache.nodeDependent.get(dyNode);
            if (linked) {
                linked.add(dRendering);
            } else {
                cache.nodeDependent.set(dyNode, new Set([dRendering]));
            }
        }
    }
    protected _addDefaultLocation(cache: RenderingEngineCache<T>, node: VNode, value: T): void {
        cache.locations.set(value, [node]);
    }
    protected _modifierIsSameAs(
        cache: RenderingEngineCache<T>,
        modifierA: Modifier | void,
        modifierB: Modifier | void,
    ): boolean {
        if (modifierA === modifierB) {
            return true;
        }
        let idA = modifierA ? cache.cachedModifierId.get(modifierA) : 'null';
        if (!idA) {
            idA = ++modifierId;
            cache.cachedModifierId.set(modifierA, idA);
        }
        let idB = modifierB ? cache.cachedModifierId.get(modifierB) : 'null';
        if (!idB) {
            idB = ++modifierId;
            cache.cachedModifierId.set(modifierB, idB);
        }
        const key: ModifierPairId = idA > idB ? idA + '-' + idB : idB + '-' + idA;
        if (key in cache.cachedIsSameAsModifier) {
            return cache.cachedIsSameAsModifier[key];
        }
        const isSame =
            (!modifierA || modifierA.isSameAs(modifierB)) &&
            (!modifierB || modifierB.isSameAs(modifierA));
        cache.cachedIsSameAsModifier[key] = isSame;
        if (!cache.cachedIsSameAsModifierIds[idA]) {
            cache.cachedIsSameAsModifierIds[idA] = [key];
        } else {
            cache.cachedIsSameAsModifierIds[idA].push(key);
        }
        if (!cache.cachedIsSameAsModifierIds[idB]) {
            cache.cachedIsSameAsModifierIds[idB] = [key];
        } else {
            cache.cachedIsSameAsModifierIds[idB].push(key);
        }
        return isSame;
    }
}

export type RenderingEngineConstructor<T = {}> = {
    new (...args: ConstructorParameters<typeof RenderingEngine>): RenderingEngine;
    id: RenderingIdentifier;
    extends: RenderingIdentifier[];
    defaultRenderer: RendererConstructor<T>;
    defaultModifierRenderer: ModifierRendererConstructor<T>;
};
export interface RenderingEngine<T = {}> {
    constructor: RenderingEngineConstructor<T>;
}
