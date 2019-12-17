import { JWPlugin } from '../../core/src/JWPlugin';
import { CharNode } from './VNodes/CharNode';
import { removeFormattingSpace } from '../../utils/src/formattingSpace';

export class Char extends JWPlugin {
    static readonly nodes = [CharNode];
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
