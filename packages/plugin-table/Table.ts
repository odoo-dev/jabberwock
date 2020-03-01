import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { TableDomParser } from './TableDomParser';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Table<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser> {
    readonly loadables = {
        parsers: [TableDomParser],
    };
}
