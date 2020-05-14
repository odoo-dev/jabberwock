import { FormatDomRenderer } from '../../plugin-inline/src/FormatDomRenderer';
import { CharNode } from './CharNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Format } from '../../plugin-inline/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class CharFormatHtmlDomRenderer extends FormatDomRenderer {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = CharNode;

    async render(node: CharNode): Promise<Node[]> {
        const previousSibling = node.previousSibling();
        if (previousSibling && node.isSameTextNode(previousSibling)) {
            return this.engine.render(previousSibling);
        }

        const textNode = await this.super.render(node);

        // If the node has attributes, wrap it inside a span with those
        // attributes.
        let rendering: Node[];
        const attributes = node.modifiers.find(Attributes);
        if (attributes?.length) {
            const span = document.createElement('span');
            this.engine.renderAttributes(Attributes, node, span);
            textNode.forEach(child => span.appendChild(child));
            rendering = [span];
        } else {
            rendering = textNode;
        }

        return this.renderFormats(node.modifiers.filter(Format), rendering);
    }
}
