import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { SubscriptDomParser } from './SubscriptDomParser';
import { Inline } from '../plugin-inline/Inline';

export class Subscript<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly parsers = [SubscriptDomParser];
}
