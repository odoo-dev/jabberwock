import { JWPlugin, ParseMethod, RenderMethod } from '../../core/src/JWPlugin';
import { VNode } from '../../core/src/VNodes/VNode';
import { CharNode } from './VNodes/CharNode';
import { removeFormattingSpace } from '../../utils/src/formattingSpace';
import { HTMLRendering } from '../../core/src/BasicHtmlRenderingEngine';
import { ParsingContext } from '../../core/src/Parser';
import { VDocumentMap } from '../../core/src/VDocumentMap';

export class Char extends JWPlugin {
    static readonly nodes = [CharNode];
    static getParser(node: Node): ParseMethod {
        if (node.nodeType === Node.TEXT_NODE) {
            return Char.parse;
        }
    }
    static getRenderer(node: VNode): RenderMethod {
        if (node instanceof CharNode) {
            return Char.render;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        const node = context.node;
        const text = removeFormattingSpace(node);
        for (let i = 0; i < text.length; i++) {
            const charNode = new CharNode(text.charAt(i));
            context.attributes.forEach((attribute, name) => {
                charNode.attributes.set(name, attribute);
            });
            VDocumentMap.set(charNode, node);
            context.parentVNode.append(charNode);
        }
        return context;
    }
    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    static render(node: CharNode): HTMLRendering {
        // Consecutive compatible char nodes are rendered as a single text node.
        let text = '' + node.char;
        let next = node.nextSibling();
        const charNodes: CharNode[] = [node];
        while (next && node._isSameAs(next)) {
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

        // Create and append the text node, update the VDocumentMap.
        let renderedNodes = [document.createTextNode(text)] as Node[];
        if (node.attributes.size) {
            node.attributes.forEach(attribute => {
                renderedNodes = attribute.render(renderedNodes);
            });
        }
        const fragment = document.createDocumentFragment();
        renderedNodes.forEach(node => fragment.appendChild(node));
        return { fragment: fragment, vNodes: charNodes };
    }
}
