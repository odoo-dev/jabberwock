import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DividerDomParser } from './DividerDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Divider<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [DividerDomParser],
    };
}
