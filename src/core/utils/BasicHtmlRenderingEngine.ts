import { VNode, VNodeType } from '../stores/VNode';

const getRenderingTagName = function(nodeType: VNodeType): string {
    switch (nodeType) {
        case 'CHAR':
            return;
        case 'HEADING1':
        case 'HEADING2':
        case 'HEADING3':
        case 'HEADING4':
        case 'HEADING5':
        case 'HEADING6':
            return 'H' + nodeType[7];
        case 'LINE_BREAK':
            return 'BR';
        case 'PARAGRAPH':
            return 'P';
        case 'ROOT':
            return 'ROOT';
    }
};
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
        const tagName = getRenderingTagName(node.type);
        const fragment = document.createDocumentFragment();
        const renderedElement = document.createElement(tagName);
        fragment.appendChild(renderedElement);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!node.hasChildren() && !node.properties.atomic) {
            renderedElement.appendChild(document.createElement('BR'));
        }

        // If a LINE_BREAK has no next sibling, it must be rendered as two BRs
        // in order for it to be visible.
        if (node.type === VNodeType.LINE_BREAK && !node.nextSibling()) {
            fragment.appendChild(document.createElement(tagName));
        }
        return fragment;
    },
};
