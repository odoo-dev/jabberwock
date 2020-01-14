import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';
import { createMap } from '../core/src/VDocumentMap';

export class LineBreak extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        const parsedNode = new LineBreakNode();
        const parsingMap = createMap([[parsedNode, context.currentNode]]);
        return [context, parsingMap];
    }
}
