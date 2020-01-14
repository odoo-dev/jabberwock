import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';

export class LineBreak extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        context.lastParsed = [new LineBreakNode()];
        return context;
    }
}
