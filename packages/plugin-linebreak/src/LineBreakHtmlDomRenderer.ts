import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { LineBreakNode } from './LineBreakNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class LineBreakHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: LineBreakNode): Promise<Node[]> {
        const br = document.createElement('br');
        this.engine.renderAttributes(node.attributes, br);
        const rendering = [br];
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            rendering.push(document.createElement('br'));
        }
        return rendering;
    }
}
