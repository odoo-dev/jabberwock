import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { SpanXmlDomParser } from './SpanXmlDomParser';
import { Inline } from '../../plugin-inline/src/Inline';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Span<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser> = {
        parsers: [SpanXmlDomParser],
    };
}
