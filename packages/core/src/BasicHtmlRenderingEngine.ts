import { VNode } from './VNodes/VNode';
import { VElement } from './VNodes/VElement';

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
    render: (node: VNode) => {};
}

export type HTMLRendering = { fragment: DocumentFragment; vNodes: VNode[] };

export const BasicHtmlRenderingEngine = {
    /**
     * Render the given node to HTML.
     *
     * @param node
     */
    render: function(node: VElement): HTMLRendering {
        return VElement.render(node);
    },
};
