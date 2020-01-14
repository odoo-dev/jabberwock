import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';
import { createMap } from '../core/src/VDocumentMap';

export class LineBreak extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        const parsedNode = new LineBreakNode();
        context.parsingMap = createMap([[parsedNode, context.currentNode]]);
        return context;
    }
}
