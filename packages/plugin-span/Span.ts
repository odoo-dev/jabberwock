import { JWPlugin } from '../core/src/JWPlugin';
import { SpanDomParser } from './SpanDomParser';

export class Span extends JWPlugin {
    readonly parsers = [SpanDomParser];
}
