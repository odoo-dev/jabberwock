import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { PreNode } from './PreNode';

export class PreHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = PreNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: PreNode): Promise<Node[]> {
        const pre = document.createElement('pre');
        this.engine.renderAttributes(node.attributes, pre);
        for (const child of node.children()) {
            const domChildren = await this.renderChild(child);
            pre.append(...domChildren);
        }
        return [pre];
    }
}
