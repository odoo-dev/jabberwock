import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { ItalicDomParser } from './ItalicDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
import { Keymap } from '../plugin-keymap/src/Keymap';

export class Italic<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap> = {
        parsers: [ItalicDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+I',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: ItalicFormat } as FormatParams,
            },
        ],
    };
}
