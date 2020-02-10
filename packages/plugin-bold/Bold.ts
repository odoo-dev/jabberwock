import { JWPlugin } from '../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { FormatParams } from '../plugin-inline/Inline';
import { BoldDomParser } from './BoldDomParser';

export class Bold extends JWPlugin {
    readonly parsers = [BoldDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+B',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: BoldFormat } as FormatParams,
        },
    ];
}
