import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap, Parser } from '../core/src/Parser';
import { HeadingNode } from './HeadingNode';

export class Heading extends JWPlugin {
    readonly parsingFunctions = [this.parse.bind(this)];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(context.currentNode.nodeName)) {
            const parsedNode = new HeadingNode(parseInt(context.currentNode.nodeName[1]));
            parsedNode.attributes = Parser.parseAttributes(context.currentNode);
            const parsingMap = new Map([[parsedNode, [context.currentNode]]]);
            context.parentVNode.append(parsedNode);
            return [context, parsingMap];
        }
    }
}
