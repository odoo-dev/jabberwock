import { RenderingIdentifier } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { RenderingEngineWorker } from './RenderingEngineCache';

class SuperRenderer<T> {
    constructor(public renderer: NodeRenderer<T>) {}
    /**
     * Render the given node.
     *
     * @param node
     */
    render(node: VNode, worker: RenderingEngineWorker<T>): Promise<T> {
        const nextRenderer = worker.getCompatibleRenderer(node, this.renderer);
        return nextRenderer?.render(node, worker);
    }
    /**
     * Render the given group of nodes.
     *
     * @param node
     */
    async renderBatch(nodes: VNode[], worker: RenderingEngineWorker<T>): Promise<T[]> {
        await Promise.all(worker.renderBatched(nodes, this.renderer));
        return nodes.map(node => worker.getRendering(node));
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
    abstract render(node: VNode, worker: RenderingEngineWorker<T>): Promise<T>;
    /**
     * Render the given group of nodes.
     * The indices of the DomObject list match the indices of the given nodes
     * list.
     *
     * @param node
     */
    renderBatch(nodes: VNode[], worker: RenderingEngineWorker<T>): Promise<T[]> {
        return Promise.all(nodes.map(node => this.render(node, worker)));
    }
}

export interface NodeRenderer<T = {}> {
    constructor: RendererConstructor<T>;
}

export type RendererConstructor<T = {}> = {
    new (engine: RenderingEngine<T>): NodeRenderer<T>;
    id: RenderingIdentifier;
};
