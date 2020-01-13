import { JWPlugin } from '../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { ParsingFunction } from '../core/src/Parser';

export class LineBreak extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [LineBreak.parse];
    static parse(node: Node): LineBreakNode[] {
        if (node.nodeName === 'BR') {
            return [new LineBreakNode()];
        }
    }
}
