import { JWPlugin } from '../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { ItalicDomParser } from './ItalicDomParser';

export class Italic extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [ItalicDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+I',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: ItalicFormat } as FormatParams,
        },
    ];
}
