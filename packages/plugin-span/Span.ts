import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { SpanDomParser } from './SpanDomParser';
import { Inline } from '../plugin-inline/Inline';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Span<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser> {
    static dependencies = [Inline];
    readonly loadables = {
        parsers: [SpanDomParser],
    };
}
