import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BlockquoteDomParser } from './BlockquoteDomParser';

export class Blockquote<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [BlockquoteDomParser];
}
