import { RenderingIdentifier } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { flat } from '../../utils/src/utils';

class SuperRenderer<T> {
    constructor(public renderer: NodeRenderer<T>) {}
    /**
     * Render the given node.
     *
     * @param node
     */
    render(node: VNode): Promise<T> {
        const nextRenderer = this.renderer.engine.getCompatibleRenderer(node, this.renderer);
        return nextRenderer?.render(node);
    }
    /**
     * Render the given group of nodes.
     *
     * @param node
     */
    async renderBatch(nodes: VNode[]): Promise<T[]> {
        const renderings: Promise<T[]>[] = [];
        const groups = this.renderer.engine.renderBatched(nodes, this.renderer);
        for (const [, rendering] of groups) {
            renderings.push(rendering);
        }
        return flat(await Promise.all(renderings));
    }
}

interface SuperRenderer<T = {}> {
    constructor: RendererConstructor<T>;
}

export abstract class NodeRenderer<T> {
    static id: RenderingIdentifier;
    readonly predicate?: Predicate;
    readonly engine: RenderingEngine<T>;
    readonly super: SuperRenderer<T>;
    constructor(engine: RenderingEngine<T>) {
        this.engine = engine;
        this.super = new SuperRenderer(this);
    }
    /**
     * Render the given node.
     *
     * @param node
     */
    abstract render(node: VNode): Promise<T>;
    /**
     * Render the given group of nodes.
     * The indices of the DomObject list match the indices of the given nodes
     * list.
     *
     * @param node
     */
    renderBatch(nodes: VNode[]): Promise<T[]> {
        return Promise.all(nodes.map(node => this.render(node)));
    }
}

export interface NodeRenderer<T = {}> {
    constructor: RendererConstructor<T>;
}

export type RendererConstructor<T = {}> = {
    new (engine: RenderingEngine<T>): NodeRenderer<T>;
    id: RenderingIdentifier;
};
