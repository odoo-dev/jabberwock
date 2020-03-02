import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParagraphDomParser } from './ParagraphDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Paragraph<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [ParagraphDomParser],
    };
}
