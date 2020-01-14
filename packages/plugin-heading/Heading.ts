import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            return Heading.parse;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        context.lastParsed = [new HeadingNode(parseInt(context.node.nodeName[1]))];
        return context;
    }
}
