import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { SuperscriptXmlDomParser } from './SuperscriptXmlDomParser';
import { Inline } from '../../plugin-inline/src/Inline';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Superscript<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser> = {
        parsers: [SuperscriptXmlDomParser],
    };
}
