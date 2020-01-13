import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Heading.parse];
    static parse(node: Node): HeadingNode[] {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            return [new HeadingNode(parseInt(node.nodeName[1]))];
        }
    }
}
