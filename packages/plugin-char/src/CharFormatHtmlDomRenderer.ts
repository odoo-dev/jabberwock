import { InlineFormatDomRenderer } from '../../plugin-inline/src/InlineFormatDomRenderer';
import { CharNode } from './CharNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class CharFormatHtmlDomRenderer extends InlineFormatDomRenderer {
    static id = 'dom/html';
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
        const attributeNames = Object.keys(node.attributes);
        if (attributeNames.length) {
            const span = document.createElement('span');
            this.engine.renderAttributes(node.attributes, span);
            textNode.forEach(child => span.appendChild(child));
            rendering = [span];
        } else {
            rendering = textNode;
        }

        return this.renderFormats(node.formats, rendering);
    }
}
