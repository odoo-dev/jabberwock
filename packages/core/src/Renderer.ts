import { VDocument } from './VDocument';

export type RendererIdentifier = string;
export type RenderingFunction<Context = {}, T = {}> = (context: Context) => T;

export abstract class Renderer<Context = {}, T = {}> {
    readonly id: RendererIdentifier;
    renderingFunctions = new Set<RenderingFunction<Context, T>>();
    abstract render(vDocument: VDocument, target: Element): void;
    /**
     * Add a renderinging function to the ones that this Renderer can handle.
     *
     * @param renderingFunction
     */
    addRenderingFunction(renderingFunction: RenderingFunction<Context, T>): void {
        this.renderingFunctions.add(renderingFunction);
    }
}
