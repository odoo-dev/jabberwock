import { JWPlugin } from '../core/src/JWPlugin';
import { SuperscriptDomParser } from './SuperscriptDomParser';
import { Inline } from '../plugin-inline/Inline';

export class Superscript extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [SuperscriptDomParser];
}
