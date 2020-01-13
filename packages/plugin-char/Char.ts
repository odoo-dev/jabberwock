import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { ParsingFunction } from '../core/src/Parser';
import { removeFormattingSpace } from '../utils/src/formattingSpace';

export class Char extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeType === Node.TEXT_NODE) {
            return Char.parse;
        }
    }
    static parse(node: Node): CharNode[] {
        const vNodes: CharNode[] = [];
        const text = removeFormattingSpace(node);
        for (let i = 0; i < text.length; i++) {
            const parsedVNode = new CharNode(text.charAt(i));
            vNodes.push(parsedVNode);
        }
        return vNodes;
    }
}
