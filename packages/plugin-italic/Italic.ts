import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { ItalicDomParser } from './ItalicDomParser';

export class Italic<T extends JWPluginConfig> extends JWPlugin<T> {
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
