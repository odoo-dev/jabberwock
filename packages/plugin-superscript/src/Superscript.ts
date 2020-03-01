import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { SuperscriptDomParser } from './SuperscriptDomParser';
import { Inline } from '../../plugin-inline/src/Inline';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Superscript<T extends JWPluginConfig> extends JWPlugin<T>
    implements Loadables<Parser> {
    static dependencies = [Inline];
    readonly loadables = {
        parsers: [SuperscriptDomParser],
    };
}
