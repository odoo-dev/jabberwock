import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ShadowNode } from './ShadowNode';

export class ShadowHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ShadowNode;

    async render(node: ShadowNode): Promise<Node[]> {
        const element = document.createElement('jw-shadow');
        const shadowRoot = element.attachShadow({ mode: 'open' });
        const renderedChildren = await this.renderChildren(node);
        shadowRoot.append(...renderedChildren.flat());
        return [element];
    }
}
