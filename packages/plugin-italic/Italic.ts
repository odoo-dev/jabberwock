import { JWPlugin } from '../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams } from '../plugin-inline/Inline';
import { ItalicDomParser } from './ItalicDomParser';

export class Italic extends JWPlugin {
    readonly parsers = [ItalicDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+I',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: ItalicFormat } as FormatParams,
        },
    ];
}
