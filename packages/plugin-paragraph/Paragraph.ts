import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap, Parser } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';

export class Paragraph extends JWPlugin {
    readonly parsingFunctions = [this.parse.bind(this)];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'P') {
            const parsedNode = new ParagraphNode();
            parsedNode.attributes = Parser.parseAttributes(context.currentNode);
            const parsingMap = new Map([[parsedNode, [context.currentNode]]]);
            context.parentVNode.append(parsedNode);
            return [context, parsingMap];
        }
    }
}
