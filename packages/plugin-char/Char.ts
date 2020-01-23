import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { CharNode } from './CharNode';
import { removeFormattingSpace } from '../utils/src/formattingSpace';
import { Format } from '../utils/src/Format';

export class Char extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Char.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeType === Node.TEXT_NODE) {
            const vNodes: CharNode[] = [];
            const text = removeFormattingSpace(context.currentNode);
            const format = context.format;
            for (let i = 0; i < text.length; i++) {
                const parsedVNode = new CharNode(text.charAt(i), { ...format });
                vNodes.push(parsedVNode);
            }
            const parsingMap = new Map(
                vNodes.map(vNode => {
                    const domNodes = [context.currentNode];
                    let parent = context.currentNode.parentNode;
                    while (parent && Format.tags.includes(parent.nodeName)) {
                        domNodes.unshift(parent);
                        parent = parent.parentNode;
                    }
                    return [vNode, domNodes];
                }),
            );
            vNodes.forEach(node => context.parentVNode.append(node));
            return [context, parsingMap];
        }
    }
}
