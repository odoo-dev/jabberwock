import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { UnderlineDomParser } from './UnderlineDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Underline<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser> {
    static dependencies = [Inline];
    readonly loadables = {
        parsers: [UnderlineDomParser],
    };
    shortcuts = [
        {
            pattern: 'CTRL+U',
            commandId: 'toggleFormat',
            commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
        },
    ];
}
