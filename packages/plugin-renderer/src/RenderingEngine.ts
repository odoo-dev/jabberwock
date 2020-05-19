import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { Constructor } from '../../utils/src/utils';
import JWEditor from '../../core/src/JWEditor';

export type RenderingIdentifier = string;

export interface Renderer<T = {}> {
    predicate?: Predicate;
    render: (node: VNode) => Promise<T>;
    constructor: RendererConstructor<T>;
}

export type RendererConstructor<T = {}> = {
    new (...args): Renderer<T>;
    id: RenderingIdentifier;
};

class SuperRenderer<T> implements Renderer<T> {
    static id = 'super';
    constructor(public render: (node: VNode) => Promise<T>) {}
}

interface SuperRenderer<T = {}> {
    constructor: RendererConstructor<T>;
}

export class RenderingEngine<T = {}> {
    static readonly id: RenderingIdentifier;
    static readonly extends: RenderingIdentifier[] = [];
    static readonly defaultRenderer: RendererConstructor;
    readonly editor: JWEditor;
    readonly renderers: Renderer<T>[] = [];
    readonly renderings: Map<VNode, [Renderer<T>, Promise<T>, boolean][]> = new Map();
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
        const superRenderer: Renderer<T> = new SuperRenderer(this._render.bind(this));
        if (RendererClass.id === this.constructor.id) {
            this.renderers.unshift(new RendererClass(this, superRenderer));
        } else {
            const supportedTypes = [this.constructor.id, ...this.constructor.extends];
            const priorRendererIds = supportedTypes.slice(
                0,
                supportedTypes.indexOf(RendererClass.id),
            );
            const postRendererIndex = this.renderers.findIndex(
                parser => !priorRendererIds.includes(parser.constructor.id),
            );
            this.renderers.splice(postRendererIndex, 0, new RendererClass(this, superRenderer));
        }
    }

    /**
     * Render the given node. If a prior rendering already exists for this node
     * in this run, return it directly.
     *
     * @param node
     */
    async render(node: VNode): Promise<T> {
        const renderings = this.renderings.get(node);
        if (renderings && renderings.length) {
            return renderings[0][1];
        } else {
            return this._render(node);
        }
    }

    /**
     * Return the rendering of several nodes, so as to skip rendering them again
     * later in the process.
     *
     * @param nodes
     * @param rendering
     */
    async rendered(nodes: VNode[], rendering: [Renderer<T>, Promise<T>]): Promise<T> {
        for (const node of nodes) {
            const renderings = this.renderings.get(node) || [];
            renderings.push(rendering);
        }
        return rendered;
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
     * Trigger the rendering of the given node by the next compatible renderer
     * that has not yet produced a rendering for this run.
     *
     * @param node
     */
    async _render(node: VNode): Promise<T> {
        const renderings = this.renderings.get(node) || [];
        // TODO: test all renders with predicates before no predicates
        const lastRendering = renderings[renderings.length - 1];
        const lastRenderer = lastRendering && lastRendering[0];
        let nextRendererIndex = this.renderers.indexOf(lastRenderer) + 1;
        let nextRenderer: Renderer<T>;
        do {
            nextRenderer = this.renderers[nextRendererIndex];
            nextRendererIndex++;
        } while (nextRenderer && !node.test(nextRenderer.predicate));
        if (!nextRenderer) return;

        // This promise will be returned synchronously and will be resolved
        // later with the same return value as the asynchronous render call.
        const rendererProm = new Promise<T>((resolve): void => {
            Promise.resolve().then(() => {
                nextRenderer.render(node).then(resolve);
            });
        });
        renderings.push([nextRenderer, rendererProm]);
        this.renderings.set(node, renderings);
        return rendererProm;
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
