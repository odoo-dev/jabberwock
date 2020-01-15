import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { ParsingFunction } from '../core/src/Parser';

export class Char extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [CharNode.parse];
}
