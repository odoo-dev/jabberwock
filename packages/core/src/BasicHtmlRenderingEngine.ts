import { VElement } from './VNodes/VElement';
import { RenderingContext } from './Renderer';

/**
 * Renderers exist to render a node into another, different format. Each
 * format is implemented by a separate renderer following this interface.
 */
export interface RenderingEngine {
    /**
     * Render the given node to the format implemented by this renderer.
     *
     * The type of the format that is implemented by each renderer cannot be
     * known from the interface itself and so will need to be casted when used.
     */
    render: (context: RenderingContext) => RenderingContext;
}

export const BasicHtmlRenderingEngine = {
    /**
     * Render the given node to HTML.
     *
     * @param node
     */
    render: function(context: RenderingContext): RenderingContext {
        return VElement.render(context);
    },
};
