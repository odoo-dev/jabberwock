import { VNode } from './VNodes/VNode';

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

export const BasicHtmlRenderingEngine = {
    /**
     * Render the given node to HTML.
     *
     * @param node
     */
    render: function(node: VNode): DocumentFragment {
        const tagName = node.htmlTag;
        const fragment = document.createDocumentFragment();
        const renderedElement = document.createElement(tagName);
        fragment.appendChild(renderedElement);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!node.hasChildren() && !node.atomic) {
            renderedElement.appendChild(document.createElement('BR'));
        }
        return fragment;
    },
};
