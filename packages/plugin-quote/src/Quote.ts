import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Inline } from '../../plugin-inline/src/Inline';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { Parser } from '../../plugin-parser/src/Parser';
import { QuoteXmlDomParser } from './QuoteXmlDomParser';

export class Quote<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [QuoteXmlDomParser],
    };
}
