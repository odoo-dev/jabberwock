import { JWPlugin } from '../core/src/JWPlugin';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { UnderlineDomParser } from './UnderlineDomParser';

export class Underline extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [UnderlineDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+U',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
        },
    ];
}
