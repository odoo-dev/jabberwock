import { JWPlugin } from '../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { ParsingFunction } from '../core/src/Parser';

export class LineBreak extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static parse(): LineBreakNode[] {
        return [new LineBreakNode()];
    }
}
