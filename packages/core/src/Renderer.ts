import { VDocument } from './VDocument';

export type RenderingFunction<Context, T> = (context: Context) => T;

export class Renderer<Context, T> {
    renderingFunctions = new Set<RenderingFunction<Context, T>>();
    readonly id: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
    render(vDocument: VDocument, target: Element): void {}
    /**
     * Add a renderinging function to the ones that this Renderer can handle.
     *
     * @param renderingFunction
     */
    addRenderingFunction(renderingFunction: RenderingFunction<Context, T>): void {
        this.renderingFunctions.add(renderingFunction);
    }
}
