import { VNode, Predicate } from './VNodes/VNode';
import { Constructor } from '../../utils/src/utils';

export type RenderingIdentifier = string;

export interface Renderer<T = {}> {
    predicate?: Predicate<boolean | VNode>;
    render: (node: VNode) => Promise<T>;
}

export type RendererConstructor<T = {}> = Constructor<Renderer<T>> & {
    id: RenderingIdentifier;
};

export class RenderingEngine<T = {}> {
    id: RenderingIdentifier;
    renderers: Renderer<T>[] = [];
    renderings: Map<VNode, [Renderer<T>, Promise<T>][]> = new Map();

    constructor(identifier: string) {
        this.id = identifier;
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
        if (renderer.predicate) {
            this.renderers.unshift(renderer);
        } else {
            // Default renderer is last in line.
            this.renderers.push(renderer);
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
