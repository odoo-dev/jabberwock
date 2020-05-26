import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { VNode } from '../../core/src/VNodes/VNode';

export class CharHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    predicate = CharNode;

    async render(node: CharNode): Promise<Node[]> {
        // Consecutive compatible char nodes are rendered as a single text node.
        let text = '' + node.char;
        const charNodes = [node];
        let nodeAfterText: VNode;
        const childVNodes = node.parent.childVNodes;
        const len = childVNodes.length;
        for (let index = childVNodes.indexOf(node) + 1; index < len && !nodeAfterText; index++) {
            const next = childVNodes[index];
            if (next instanceof CharNode && node.isSameTextNode(next)) {
                charNodes.push(next);
                if (next.char === ' ' && text[text.length - 1] === ' ') {
                    // Browsers don't render consecutive space chars otherwise.
                    text += '\u00A0';
                } else {
                    text += next.char;
                }
            } else if (next.tangible) {
                nodeAfterText = next;
            }
        }
        // Render block edge spaces as non-breakable space (otherwise browsers
        // won't render them).
        const previous = node.previousSibling();
        if (!previous || !previous.is(InlineNode)) {
            text = text.replace(/^ /g, '\u00A0');
        }
        if (!nodeAfterText || !nodeAfterText.is(InlineNode)) {
            text = text.replace(/ $/g, '\u00A0');
        }
        const rendering = Promise.resolve([document.createTextNode(text)]);
        return this.engine.rendered(charNodes, [this, rendering]);
    }
}
