import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { Constructor } from '../../utils/src/utils';
import JWEditor from '../../core/src/JWEditor';

export type RenderingIdentifier = string;

export interface Renderer<T = {}> {
    predicate?: Predicate;
    render: (node: VNode) => Promise<T>;
}

export type RendererConstructor<T = {}> = Constructor<Renderer<T>> & {
    id: RenderingIdentifier;
};

export type RenderingEngineConstructor<T = {}> = Constructor<RenderingEngine> & {
    id: RenderingIdentifier;
    defaultRenderer: Constructor<Renderer<T>>;
};

export interface RenderingEngine<T = {}> {
    constructor: RenderingEngineConstructor<T>;
}
export class RenderingEngine<T = {}> {
    static readonly id: RenderingIdentifier;
    static readonly defaultRenderer: Constructor<Renderer>;
    readonly editor: JWEditor;
    readonly renderers: Renderer<T>[] = [];
    readonly renderings: Map<VNode, [Renderer<T>, Promise<T>, VNode[]][]> = new Map();

    constructor(editor: JWEditor) {
        this.editor = editor;
        const defaultRenderer = new this.constructor.defaultRenderer(this);
        if (defaultRenderer.predicate) {
            throw `Default renderer cannot have a predicate.`;
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
    register(RendererClass: Constructor<Renderer<T>>): void {
        const superRenderer: Renderer<T> = {
            render: this._render.bind(this),
        };
        const renderer = new RendererClass(this, superRenderer);
        this.renderers.unshift(renderer);
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
     * Render the contents of a node that has no children.
     *
     * @param node
     */
    async renderEmpty?(node: VNode): Promise<T>;

    /**
     * Return the rendering of several nodes, so as to skip rendering them again
     * later in the process.
     *
     * @param nodes
     * @param rendering
     */
    async rendered(nodes: VNode[], renderer: Renderer<T>, rendered: Promise<T>): Promise<T> {
        for (const node of nodes) {
            const renderings = this.renderings.get(node) || [];
            const index = renderings.findIndex(rendering => rendering[0] === renderer);
            if (index === -1) {
                renderings.push([renderer, rendered, nodes]);
            } else {
                renderings[index][1] = rendered;
                renderings[index][2].push(...nodes);
            }
        }
        return rendered;
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

        const rendering: [Renderer<T>, Promise<T>, VNode[]] = [nextRenderer, null, []];
        // This promise will be returned synchronously and will be resolved
        // later with the same return value as the asynchronous render call.
        const rendererProm = new Promise<T>((resolve): void => {
            Promise.resolve().then(() => {
                const promise = rendering[2].length ? rendering[1] : nextRenderer.render(node);
                promise.then(n => {
                    if (!rendering[2].includes(node)) {
                        rendering[2].push(node);
                    }
                    resolve(n);
                });
            });
        });

        rendering[1] = rendererProm;
        renderings.push(rendering);
        this.renderings.set(node, renderings);
        return rendererProm;
    }
}
