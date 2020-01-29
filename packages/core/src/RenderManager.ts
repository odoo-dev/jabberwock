// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RenderingFunction = (...args: any[]) => any;
export type RenderingFunctions = Set<RenderingFunction>;

export class RenderManager {
    functions: Record<string, RenderingFunctions> = {};

    getRenderer(format: string): RenderingFunctions {
        let renderFunctions = this.functions[format];
        if (!renderFunctions) {
            renderFunctions = this.functions[format] = new Set();
        }
        return renderFunctions;
    }
    /**
     * Add a renderinging function to the ones that this Renderer can handle.
     *
     * @param renderingFunction
     */
    addRenderingFunction(format: string, renderingFunction: RenderingFunction): void {
        const renderFunctions = this.getRenderer(format);
        renderFunctions.add(renderingFunction);
    }
}
