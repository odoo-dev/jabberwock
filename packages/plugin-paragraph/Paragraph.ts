import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';

export class Paragraph extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [Paragraph.parse];
    static parse(node: Node): ParagraphNode[] {
        if (node.nodeName === 'P') {
            return [new ParagraphNode()];
        }
    }
}
