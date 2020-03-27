import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomRenderer } from './DefaultDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export class DomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom';
    static readonly defaultRenderer = DefaultDomRenderer;
    /**
     * Render the attributes of the given VNode onto the given DOM Element.
     *
     * @param node
     */
    renderAttributes(
        attributes: Record<string, string | Record<string, string>>,
        element: Element,
    ): void {
        for (const name of Object.keys(attributes).sort()) {
            const value = attributes[name];
            if (typeof value === 'string') {
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
