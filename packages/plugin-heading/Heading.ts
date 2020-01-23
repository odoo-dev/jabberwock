import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [HeadingNode.parse];
}
