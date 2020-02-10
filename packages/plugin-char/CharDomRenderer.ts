import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { CharNode } from './CharNode';

export class CharDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
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
        // Browsers don't render leading/trailing space chars otherwise.
        text = text.replace(/^ | $/g, '\u00A0');
        const rendering = Promise.resolve([document.createTextNode(text)]);
        return this.engine.rendered(charNodes, [this, rendering]);
    }
}
