import { JWPlugin } from '../core/src/JWPlugin';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams } from '../plugin-inline/Inline';
import { UnderlineDomParser } from './UnderlineDomParser';

export class Underline extends JWPlugin {
    readonly parsers = [UnderlineDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+U',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
        },
    ];
}
