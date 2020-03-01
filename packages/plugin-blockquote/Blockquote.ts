import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { BlockquoteDomParser } from './BlockquoteDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Blockquote<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser> {
    readonly loadables = {
        parsers: [BlockquoteDomParser],
    };
}
