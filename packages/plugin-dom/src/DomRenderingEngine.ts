import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomRenderer } from './DefaultDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';

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
        for (const name of Object.keys(attributes)) {
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
        return node.atomic ? [] : [document.createElement('br')];
    }
}
