import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { PreNode } from './PreNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class PreHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = PreNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: PreNode): Promise<Node[]> {
        const pre = document.createElement('pre');
        this.engine.renderAttributes(Attributes, node, pre);
        const renderedChildren = await this.renderChildren(node);
        pre.append(...renderedChildren.flat());
        return [pre];
    }
}
