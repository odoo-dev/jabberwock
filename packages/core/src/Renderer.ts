import { VDocument } from './VDocument';
import { VNode } from './VNodes/VNode';

export type RenderingMap = Map<VNode, Node[]>;
export interface RenderingContext<T extends VNode = VNode> {
    root: VNode; // Root VNode of the current rendering.
    currentVNode?: T; // Current VNode rendered at this step.
    parentNode?: Node | DocumentFragment; // Node to render the VNode into.
}
export type RenderingFunction<T> = (node: VNode, defaultRendering?: T) => T;

export class Renderer<T> {
    renderingFunctions = new Set<RenderingFunction<T>>();
    readonly id: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
    render(vDocument: VDocument, target: Element): void {}
    /**
     * Add a renderinging function to the ones that this Renderer can handle.
     *
     * @param renderingFunction
     */
    addRenderingFunction(renderingFunction: RenderingFunction<T>): void {
        this.renderingFunctions.add(renderingFunction);
    }
}
