import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BlockquoteDomParser } from './BlockquoteDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Blockquote<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [BlockquoteDomParser],
    };
}
