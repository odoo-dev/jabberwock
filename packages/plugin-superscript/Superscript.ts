import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { SuperscriptDomParser } from './SuperscriptDomParser';
import { Inline } from '../plugin-inline/Inline';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Superscript<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser> = {
        parsers: [SuperscriptDomParser],
    };
}
