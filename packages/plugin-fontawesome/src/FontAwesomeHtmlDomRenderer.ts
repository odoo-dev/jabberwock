import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FontAwesomeNode } from './FontAwesomeNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

const zeroWidthSpace = '\u200b';

export class FontAwesomeHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = FontAwesomeNode;

    async render(node: FontAwesomeNode): Promise<Node[]> {
        const fontawesome = document.createElement(node.htmlTag);
        this.engine.renderAttributes(Attributes, node, fontawesome);
        // Surround the fontawesome with two invisible characters so the
        // selection can navigate around it.
        return [
            document.createTextNode(zeroWidthSpace),
            fontawesome,
            document.createTextNode(zeroWidthSpace),
        ];
    }
}
