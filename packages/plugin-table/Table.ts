import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { TableDomParser } from './TableDomParser';

export class Table<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [TableDomParser];
}
