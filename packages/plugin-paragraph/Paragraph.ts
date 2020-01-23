import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction } from '../core/src/Parser';
import { ParagraphNode } from './ParagraphNode';

export class Paragraph extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [ParagraphNode.parse];
}
