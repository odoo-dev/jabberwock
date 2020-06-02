import { PreNode } from './PreNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class PreCharHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;

    predicate = (item: VNode): boolean => item.is(CharNode) && !!item.ancestor(PreNode);

    /**
     * Render the VNode to the given format.
     */
    async render(node: CharNode): Promise<Node[]> {
        const rendering = await this.super.render(node);
        rendering[0].textContent = rendering[0].textContent.replace(/\u00A0/g, ' ');
        return rendering;
    }
}
