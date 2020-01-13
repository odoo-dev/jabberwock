import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { ParsingFunction } from '../core/src/Parser';
import { removeFormattingSpace } from '../utils/src/formattingSpace';

export class Char extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Char.parse];
    static parse(node: Node): CharNode[] {
        if (node.nodeType === Node.TEXT_NODE) {
            const vNodes: CharNode[] = [];
            const text = removeFormattingSpace(node);
            for (let i = 0; i < text.length; i++) {
                const parsedVNode = new CharNode(text.charAt(i));
                vNodes.push(parsedVNode);
            }
            return vNodes;
        }
    }
}
