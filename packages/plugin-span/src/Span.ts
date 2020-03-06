import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { SpanDomParser } from './SpanDomParser';
import { Inline } from '../../plugin-inline/src/Inline';

export class Span<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly parsers = [SpanDomParser];
}
