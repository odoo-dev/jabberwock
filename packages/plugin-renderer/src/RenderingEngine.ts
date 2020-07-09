import { VNode } from '../../core/src/VNodes/VNode';
import { isConstructor } from '../../utils/src/utils';
import JWEditor from '../../core/src/JWEditor';
import { Modifier } from '../../core/src/Modifier';
import { ModifierRenderer, ModifierRendererConstructor } from './ModifierRenderer';
import { NodeRenderer, RendererConstructor } from './NodeRenderer';

export type RenderingIdentifier = string;

export class RenderingEngine<T = {}> {
    static readonly id: RenderingIdentifier;
    static readonly extends: RenderingIdentifier[] = [];
    static readonly defaultRenderer: RendererConstructor;
    static readonly defaultModifierRenderer: ModifierRendererConstructor;
    readonly editor: JWEditor;
    readonly renderers: NodeRenderer<T>[] = [];
    readonly modifierRenderers: ModifierRenderer<T>[] = [];
    readonly renderings: Map<VNode, Promise<T>> = new Map();
    readonly locations: Map<T, VNode[]> = new Map();

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
     *
     * @param node
     */
    async render(nodes: VNode[]): Promise<T[]> {
        const groups = this.renderBatched(nodes);
        for (const [nodes, promiseBatch] of groups) {
            for (const index in nodes) {
                const node = nodes[index];
                const promise = new Promise<T>(resolve => {
                    promiseBatch.then(values => {
                        resolve(values[index]);
                    });
                });
                this.renderings.set(node, promise);
            }
        }
        return Promise.all(nodes.map(node => this.renderings.get(node)));
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
    locate(nodes: VNode[], domObject: T): void {
        this.locations.set(domObject, nodes);
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
    renderBatched(nodes: VNode[], rendered?: NodeRenderer<T>): [VNode[], Promise<T[]>][] {
        const groups: [VNode[], Promise<T[]>][] = [];
        for (const node of nodes) {
            const renderer = this.getCompatibleRenderer(node, rendered);
            groups.push([[node], renderer.renderBatch(nodes)]);
        }
        return groups;
    }
    /**
     * Return the first matche Renderer for this VNode, starting from the
     * previous renderer.
     *
     * @param node
     * @param previousRenderer
     */
    getCompatibleRenderer(node: VNode, previousRenderer: NodeRenderer<T>): NodeRenderer<T> {
        let nextRendererIndex = this.renderers.indexOf(previousRenderer) + 1;
        let nextRenderer: NodeRenderer<T>;
        do {
            nextRenderer = this.renderers[nextRendererIndex];
            nextRendererIndex++;
        } while (nextRenderer && !node.test(nextRenderer.predicate));
        return nextRenderer;
    }
    /**
     * Return the first matche Renderer for this VNode, starting from the
     * previous renderer.
     *
     * @param node
     * @param previousRenderer
     */
    getCompatibleModifierRenderer(
        modifier: Modifier,
        nodes: VNode[],
        previousRenderer?: ModifierRenderer<T>,
    ): ModifierRenderer<T> {
        let nextRendererIndex = this.modifierRenderers.indexOf(previousRenderer) + 1;
        let nextRenderer: ModifierRenderer<T>;
        do {
            nextRenderer = this.modifierRenderers[nextRendererIndex];
            nextRendererIndex++;
        } while (
            nextRenderer.predicate &&
            !(isConstructor(nextRenderer.predicate, Modifier)
                ? modifier instanceof nextRenderer.predicate
                : nextRenderer.predicate(modifier, nodes))
        );
        return nextRenderer;
    }
    /**
     * Clear the cache.
     *
     */
    clear(): void {
        this.renderings.clear();
        this.locations.clear();
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
