import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';

export class LineBreak extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [LineBreak.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'BR') {
            const parsedNode = new LineBreakNode();
            const parsingMap = new Map([[parsedNode, [context.currentNode]]]);
            return [context, parsingMap];
        }
    }
}
