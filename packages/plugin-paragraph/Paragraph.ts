import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';

export class Paragraph extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Paragraph.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'P') {
            const parsedNode = new ParagraphNode();
            const parsingMap = new Map([[parsedNode, [context.currentNode]]]);
            context.parentVNode.append(parsedNode);
            return [context, parsingMap];
        }
    }
}
