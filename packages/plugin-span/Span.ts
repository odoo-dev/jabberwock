import { JWPlugin } from '../core/src/JWPlugin';
import { SpanDomParser } from './SpanDomParser';
import { Inline } from '../plugin-inline/Inline';

export class Span extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [SpanDomParser];
}
