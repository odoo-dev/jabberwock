import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { ParagraphDomParser } from './ParagraphDomParser';

export class Paragraph<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [ParagraphDomParser];
}
