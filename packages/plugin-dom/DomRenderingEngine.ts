import { RenderingEngine } from '../core/src/RenderingEngine';
import { DefaultDomRenderer } from './DefaultDomRenderer';
import { Attributes } from '../core/src/VNodes/VNode';

export class DomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom';
    static readonly defaultRenderer = DefaultDomRenderer;
    /**
     * Render attributes on a domNode.
     *
     * @param node
     * @param domNode
     */
    renderAttributesTo(attributes: Attributes, domNode: Element): void {
        for (const name of Object.keys(attributes || {})) {
            const value = attributes[name];
            if (typeof value === 'string') {
                domNode.setAttribute(name, value);
            }
        }
    }
}
