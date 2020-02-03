import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { CharNode } from './CharNode';
import { Char } from './Char';
import { Format } from '../utils/src/Format';

export class CharDomRenderer extends AbstractRenderer<Node[]> {
    predicate = CharNode;

    async render(node: CharNode): Promise<Node[]> {
        const previousSibling = node.previousSibling();
        if (previousSibling && Char.isSameTextNode(previousSibling, node)) {
            return this.engine.render(previousSibling);
        }
        // If the node has a format, render the format nodes first.
        const fragment = document.createDocumentFragment();
        let parent: Node = fragment;
        const renderedFormats = [];
        Object.keys(node.format).forEach(type => {
            if (node.format[type]) {
                const formatNode = document.createElement(Format.toTag(type));
                renderedFormats.push(formatNode);
                if (!parent) {
                    parent = formatNode;
                }
                parent.appendChild(formatNode);
                // Update the parent so the text is inside the format node.
                parent = formatNode;
            }
        });

        // Consecutive compatible char nodes are rendered as a single text node.
        let text = '' + node.char;
        let next = node.nextSibling();
        const charNodes = [node];
        while (next && Char.isSameTextNode(node, next)) {
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

        // Create and append the text node.
        const renderedNode = document.createTextNode(text);
        parent.appendChild(renderedNode);
        return Array.from(fragment.childNodes);
    }
}
