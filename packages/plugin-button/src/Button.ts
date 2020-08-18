import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Inline } from '../../plugin-inline/src/Inline';
import { ButtonXmlDomParser } from './ButtonXmlDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Button<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser> = {
        parsers: [ButtonXmlDomParser],
    };
}
