import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { LineBreakNode } from './LineBreakNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class LineBreakHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: LineBreakNode): Promise<Node[]> {
        const br = document.createElement('br');
        const attributes = node.modifiers.get(Attributes);
        if (attributes) {
            this.engine.renderAttributes(attributes, br);
        }
        const rendering = [br];
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            rendering.push(document.createElement('br'));
        }
        return rendering;
    }
}
