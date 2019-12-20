import { RenderingContext } from '../../core/src/Renderer';
import { VDocumentMap } from '../../core/src/VDocumentMap';
import { AttributeName, Attribute } from '../../core/src/VNodes/Attribute';
import { VNode } from '../../core/src/VNodes/VNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { RenderingEngine } from '../../core/src/RenderingEngine';

export const BasicHtmlRenderingEngine: RenderingEngine<Node> = {
    /**
     * Render the given node to HTML.
     *
     * @param node
     */
    render(context: RenderingContext): RenderingContext {
        const vNode = context.currentVNode;
        const tagName = (context.currentVNode as VElement).htmlTag;
        const element = this.renderAttributesTo(vNode.attributes, document.createElement(tagName));
        context.parentNode.appendChild(element);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!vNode.hasChildren() && !vNode.atomic) {
            element.appendChild(document.createElement('BR'));
        }

        this.addToMap(element, vNode);
        element.childNodes.forEach(child => VDocumentMap.set(vNode, child));
        return context;
    },
    addToMap(element: Node, vNode: VNode, index?: number): void {
        VDocumentMap.set(vNode, element, index);
        element.childNodes.forEach((child, index) => {
            this.addToMap(child, vNode, index);
        });
    },
    renderAttributesTo(attributes: Map<AttributeName, Attribute>, node: Node): Node {
        attributes.forEach(attribute => {
            node = attribute.renderToHtml(node);
        });
        return node;
    },
};
