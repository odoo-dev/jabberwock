import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;
    async render(node: VNode): Promise<Node[]> {
        const nodes = await super.render(node);
        if (!this.editor.mode.definition.checkEditable || node.is(AtomicNode)) {
            return nodes;
        }
        const isEditable = this.editor.mode.isNodeEditable(node);
        return nodes.map(node => {
            if (node instanceof HTMLElement && isEditable === false) {
                node.setAttribute('contenteditable', 'false');
            } else if (node instanceof HTMLElement && isEditable === true) {
                node.setAttribute('contenteditable', 'true');
            }
            return node;
        });
    }
    /**
     * Render the attributes (of the given Class extending Attributes) of the
     * given VNode onto the given DOM Element.
     *
     * @param Class
     * @param node
     * @param element
     */
    renderAttributes<T extends typeof Attributes>(Class: T, node: VNode, element: Element): void {
        const attributes = node.modifiers.find(Class);
        if (attributes) {
            for (const name of attributes.keys().sort()) {
                const value = attributes.get(name);
                element.setAttribute(name, value);
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
