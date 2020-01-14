import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext } from '../core/src/Parser';
import { CharNode } from './CharNode';
import { removeFormattingSpace } from '../utils/src/formattingSpace';
import { createMap } from '../core/src/VDocumentMap';

export class Char extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeType === Node.TEXT_NODE) {
            return Char.parse;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        const vNodes: CharNode[] = [];
        const text = removeFormattingSpace(context.currentNode);
        for (let i = 0; i < text.length; i++) {
            const parsedVNode = new CharNode(text.charAt(i));
            vNodes.push(parsedVNode);
        }
        context.parsingMap = createMap(vNodes.map(vNode => [vNode, context.currentNode]));
        return context;
    }
}
