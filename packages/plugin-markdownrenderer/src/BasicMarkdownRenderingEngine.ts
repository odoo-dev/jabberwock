import { RenderingContext } from '../../core/src/Renderer';
import { VDocumentMap } from '../../core/src/VDocumentMap';
import { VElement } from '../../core/src/VNodes/VElement';
import { RenderingEngine } from '../../core/src/RenderingEngine';

export const BasicMarkdownRenderingEngine: RenderingEngine<string> = {
    /**
     * Render the given node to HTML.
     *
     * @param node
     */
    render(context: RenderingContext): RenderingContext {
        const vNode = context.currentVNode;
        const tagName = (context.currentVNode as VElement).htmlTag;
        const element = document.createElement(tagName);
        context.parentNode.appendChild(element);
        context = BasicMarkdownRenderingEngine.renderAttributes(context);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!vNode.hasChildren() && !vNode.atomic) {
            element.appendChild(document.createElement('BR'));
        }

        // BasicMarkdownRenderingEngine.addToMap(element, vNode);
        element.childNodes.forEach(child => VDocumentMap.set(vNode, child));
        return context;
    },
    addToMap(): void {
        return;
    },
    renderAttributes(context: RenderingContext): RenderingContext {
        for (const attribute of context.currentVNode.attributes.values()) {
            context = attribute.render(context);
        }
        return context;
    },
};
