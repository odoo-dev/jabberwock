import { JWPlugin } from '../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { ParsingFunction } from '../core/src/Parser';

export class LineBreak extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [LineBreakNode.parse];
}
