import { JWPlugin } from '../core/src/JWPlugin';
import { DividerDomParser } from './DividerDomParser';

export class Divider extends JWPlugin {
    readonly parsers = [DividerDomParser];
}
