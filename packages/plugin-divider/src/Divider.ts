import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DividerDomParser } from './DividerDomParser';

export class Divider<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [DividerDomParser];
}
