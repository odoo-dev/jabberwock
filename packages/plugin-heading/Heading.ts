import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            return Heading.parse;
        }
    }
    static parse(node: Node): HeadingNode[] {
        return [new HeadingNode(parseInt(node.nodeName[1]))];
    }
}
