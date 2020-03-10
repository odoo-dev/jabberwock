import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { TableDomParser } from './TableDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';

export class Table<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser> = {
        parsers: [TableDomParser],
    };
}
