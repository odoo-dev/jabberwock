import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';

export class Paragraph extends JWPlugin {
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'P') {
            return Paragraph.parse;
        }
    }
    static parse(): ParagraphNode[] {
        return [new ParagraphNode()];
    }
}
