import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DividerXmlDomParser } from './DividerXmlDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export interface DividerConfig extends JWPluginConfig {
    breakable?: boolean;
}

export class Divider<T extends DividerConfig = DividerConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [DividerXmlDomParser],
    };
    configuration = { breakable: true, ...this.configuration };
}
