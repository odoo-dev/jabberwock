import { Renderer, RenderingIdentifier, RendererConstructor } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';

export abstract class AbstractRenderer<T> implements Renderer<T> {
    static id: RenderingIdentifier;
    readonly predicate?: Predicate;
    readonly engine: RenderingEngine<T>;
    readonly super: Renderer<T>;
    constructor(engine: RenderingEngine<T>, superRenderer: Renderer<T>) {
        this.engine = engine;
        this.super = superRenderer;
    }
    /**
     * Render the given node.
     *
     * @param node
     */
    abstract render(node: VNode): Promise<T>;
}

export interface AbstractRenderer<T = {}> {
    constructor: RendererConstructor<T>;
}
