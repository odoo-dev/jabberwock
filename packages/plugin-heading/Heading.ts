import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Heading.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(context.currentNode.nodeName)) {
            const parsedNode = new HeadingNode(parseInt(context.currentNode.nodeName[1]));
            const parsingMap = new Map([[parsedNode, [context.currentNode]]]);
            return [context, parsingMap];
        }
    }
}
