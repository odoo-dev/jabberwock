import { Renderer, RenderingIdentifier } from './RenderingEngine';
import { RenderingEngine } from './RenderingEngine';
import { VNode, Predicate } from './VNodes/VNode';

export abstract class AbstractRenderer<T> implements Renderer<T> {
    static id: RenderingIdentifier;
    predicate?: Predicate<boolean | VNode>;
    engine: RenderingEngine<T>;
    super: Renderer<T>;
    _renderChildMutex: Map<VNode, Promise<T>> = new Map();
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
    /**
     * Render the given child node. This function ensures that the promise
     * corresponding to the rendering of each child of the same parent will be
     * resolved in the order in which `renderChild` was called.
     *
     * @param child
     */
    async renderChild(child: VNode): Promise<T> {
        const parent = child.parent;
        await this._renderChildMutex.get(parent);
        const renderedChild = this.engine.render(child);
        this._renderChildMutex.set(parent, renderedChild);
        return renderedChild;
    }
    /**
     * Render the children of given node. Return a promise resolved with the
     * result of the rendering of each child concatenated into a single array
     * conserving the order of the children.
     *
     * @param node
     */
    async renderChildren(node: VNode): Promise<T[]> {
        const renderedChildren: Array<Promise<T>> = [];
        for (const child of node.children) {
            renderedChildren.push(this.engine.render(child));
        }
        return Promise.all(renderedChildren);
    }
}
