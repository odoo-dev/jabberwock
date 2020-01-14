import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';
import { createMap } from '../core/src/VDocumentMap';

export class Heading extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            return Heading.parse;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        const parsedNode = new HeadingNode(parseInt(context.currentNode.nodeName[1]));
        context.parsingMap = createMap([[parsedNode, context.currentNode]]);
        return context;
    }
}
