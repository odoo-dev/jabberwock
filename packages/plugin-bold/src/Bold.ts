import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { BoldDomParser } from './BoldDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Bold<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser>{
    static dependencies = [Inline];
    readonly loadables = {
        parsers: [BoldDomParser],
    };
    shortcuts = [
        {
            pattern: 'CTRL+B',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: BoldFormat } as FormatParams,
        },
    ];
}
