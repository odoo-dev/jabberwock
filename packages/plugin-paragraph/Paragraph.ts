import { JWPlugin } from '../core/src/JWPlugin';
import { ParagraphDomParser } from './ParagraphDomParser';

export class Paragraph extends JWPlugin {
    readonly parsers = [ParagraphDomParser];
}
