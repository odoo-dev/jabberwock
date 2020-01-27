import { JWPlugin } from '../core/src/JWPlugin';
import { SubscriptDomParser } from './SubscriptDomParser';
import { Inline } from '../plugin-inline/Inline';

export class Subscript extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [SubscriptDomParser];
}
