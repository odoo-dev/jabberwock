import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';
import { createMap } from '../core/src/VDocumentMap';

export class Paragraph extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'P') {
            return Paragraph.parse;
        }
    }
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        const parsedNode = new ParagraphNode();
        const parsingMap = createMap([[parsedNode, context.currentNode]]);
        return [context, parsingMap];
    }
}
