import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { TableDomParser } from './TableDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { TableRowDomParser } from './TableRowDomParser';
import { TableCellDomParser } from './TableCellDomParser';
import { TableDomRenderer } from './TableDomRenderer';
import { TableRowDomRenderer } from './TableRowDomRenderer';
import { TableCellDomRenderer } from './TableCellDomRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Table<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [TableDomParser, TableRowDomParser, TableCellDomParser],
        renderers: [TableDomRenderer, TableRowDomRenderer, TableCellDomRenderer],
    };
}
