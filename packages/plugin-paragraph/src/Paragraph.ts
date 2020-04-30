import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParagraphXmlDomParser } from './ParagraphXmlDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Paragraph<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [ParagraphXmlDomParser],
    };
}
