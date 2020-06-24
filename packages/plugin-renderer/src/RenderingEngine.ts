import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { Constructor } from '../../utils/src/utils';
import JWEditor from '../../core/src/JWEditor';

export type RenderingIdentifier = string;

export interface Renderer<T> {
    predicate?: Predicate;
    render: (node: VNode) => Promise<T>;
    renderBatch: (nodes: VNode[]) => Promise<T[]>;
    constructor: RendererConstructor<T>;
    super: Renderer<T>;
}

export type RendererConstructor<T = {}> = {
    new (...args): Renderer<T>;
    id: RenderingIdentifier;
};

export class RenderingEngine<T = {}> {
    static readonly id: RenderingIdentifier;
    static readonly extends: RenderingIdentifier[] = [];
    static readonly defaultRenderer: RendererConstructor;
    readonly editor: JWEditor;
    readonly renderers: Renderer<T>[] = [];
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
    }
    /**
     * Register the given renderer by instantiating it with this rendering
     * engine. The renderer constructor will receive a special second parameter
     * which is a magic renderer whose `render` method will call the next
     * compatible renderer in line for the given node.
     *
     * @param RendererClass
     */
    register(RendererClass: RendererConstructor<T>): void {
        if (RendererClass.id === this.constructor.id) {
            this.renderers.unshift(new RendererClass(this));
        } else {
            const supportedTypes = [this.constructor.id, ...this.constructor.extends];
            const priorRendererIds = supportedTypes.slice(
                0,
                supportedTypes.indexOf(RendererClass.id),
            );
            const postRendererIndex = this.renderers.findIndex(
                parser => !priorRendererIds.includes(parser.constructor.id),
            );
            this.renderers.splice(postRendererIndex, 0, new RendererClass(this));
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
    renderBatched(nodes: VNode[], rendered?: Renderer<T>): [VNode[], Promise<T[]>][] {
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
    getCompatibleRenderer(node: VNode, previousRenderer: Renderer<T>): Renderer<T> {
        let nextRendererIndex = this.renderers.indexOf(previousRenderer) + 1;
        let nextRenderer: Renderer<T>;
        do {
            nextRenderer = this.renderers[nextRendererIndex];
            nextRendererIndex++;
        } while (nextRenderer && !node.test(nextRenderer.predicate));
        return nextRenderer;
    }
}
export type RenderingEngineConstructor<T = {}> = {
    new (...args: ConstructorParameters<typeof RenderingEngine>): RenderingEngine;
    id: RenderingIdentifier;
    extends: RenderingIdentifier[];
    defaultRenderer: Constructor<Renderer<T>>;
};
export interface RenderingEngine<T = {}> {
    constructor: RenderingEngineConstructor<T>;
}
