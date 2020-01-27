import { JWPlugin } from '../core/src/JWPlugin';
import { BlockquoteDomParser } from './BlockquoteDomParser';

export class Blockquote extends JWPlugin {
    readonly parsers = [BlockquoteDomParser];
}
