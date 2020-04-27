import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { ItalicXmlDomParser } from './ItalicXmlDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';

export class Italic<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap> = {
        parsers: [ItalicXmlDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+I',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: ItalicFormat } as FormatParams,
            },
        ],
    };
}
