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
        const tagName = node.htmlTag;
        const fragment = document.createDocumentFragment();
        let renderedElements = [document.createElement(tagName)] as Node[];
        if (node.attributes.size) {
            node.attributes.forEach(attribute => {
                renderedElements = attribute.render(renderedElements);
            });
        }
        renderedElements.forEach(element => {
            fragment.appendChild(element);

            // If a node is empty but could accomodate children,
            // fill it to make it visible.
            if (!node.hasChildren() && !node.atomic) {
                element.appendChild(document.createElement('BR'));
            }
        });
        return { fragment: fragment, vNodes: [node] };
    },
};
