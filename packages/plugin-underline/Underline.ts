import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { UnderlineDomParser } from './UnderlineDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Underline<T extends JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser> = {
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
