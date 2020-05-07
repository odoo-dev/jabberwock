import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;
    /**
     * Render the attributes of the given VNode onto the given DOM Element.
     *
     * @param node
     */
    renderAttributes(attributes: Attributes, element: Element): void {
        for (const name of attributes.keys().sort()) {
            const value = attributes.get(name);
            element.setAttribute(name, value);
        }
    }
    /**
     * If a node is empty but could accomodate children, fill it to make it
     * visible.
     *
     * @param node
     */
    async renderEmpty(node: VNode): Promise<Node[]> {
        return node.is(AtomicNode) ? [] : [document.createElement('br')];
    }
}
