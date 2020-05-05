import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class CharHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    predicate = CharNode;

    async render(node: CharNode): Promise<Node[]> {
        // Consecutive compatible char nodes are rendered as a single text node.
        let text = '' + node.char;
        let next = node.nextSibling();
        const charNodes = [node];
        while (next && node.isSameTextNode(next)) {
            if (next instanceof CharNode) {
                charNodes.push(next);
                if (next.char === ' ' && text[text.length - 1] === ' ') {
                    // Browsers don't render consecutive space chars otherwise.
                    text += '\u00A0';
                } else {
                    text += next.char;
                }
            }
            next = next.nextSibling();
        }
        // Render block edge spaces as non-breakable space (otherwise browsers
        // won't render them).
        const previous = node.previousSibling();
        if (!previous || !previous.is(InlineNode)) {
            text = text.replace(/^ /g, '\u00A0');
        }
        if (!next || !next.is(InlineNode)) {
            text = text.replace(/ $/g, '\u00A0');
        }
        const rendering = Promise.resolve([document.createTextNode(text)]);
        return this.engine.rendered(charNodes, [this, rendering]);
    }
}
