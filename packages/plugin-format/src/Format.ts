import { JWPlugin } from '../../core/src/JWPlugin';
import { FormatDomParser } from './FormatDomParser';

export class FormatPlugin extends JWPlugin {
    readonly parsers = [FormatDomParser];
}
