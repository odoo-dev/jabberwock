import { RenderingEngine } from '../../core/src/RenderingEngine';
import { DefaultDomRenderer } from './DefaultDomRenderer';

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
}
