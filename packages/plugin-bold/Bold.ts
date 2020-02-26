import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { BoldDomParser } from './BoldDomParser';

export class Bold<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly parsers = [BoldDomParser];
    shortcuts = [
        {
            pattern: 'CTRL+B',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: BoldFormat } as FormatParams,
        },
    ];
}
