import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;
    /**
     * Render the attributes (of the given Class extending Attributes) of the
     * given VNode onto the given DOM Element.
     *
     * @param Class
     * @param node
     * @param element
     */
    renderAttributes<T extends typeof Attributes>(
        Class: T,
        node: VNode,
        element: HTMLElement,
    ): void {
        const attributes = node.modifiers.find(Class);
        if (attributes) {
            for (const name of attributes.keys()) {
                const value = attributes.get(name);
                element.setAttribute(name, value);
            }
            if (attributes.style.length) {
                for (const name of attributes.style.keys()) {
                    element.style.setProperty(name, attributes.style.get(name));
                }
            }
            if (attributes.classList.length) {
                for (const className of attributes.classList.items()) {
                    element.classList.add(className);
                }
            }
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
