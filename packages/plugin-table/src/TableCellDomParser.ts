import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { TableCellNode } from './TableCellNode';

export class TableCellDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): item is HTMLTableCellElement => {
        return item.nodeName === 'TD' || item.nodeName === 'TH';
    };

    /**
     * Parse a table cell node.
     *
     * @param item
     */
    async parse(item: HTMLTableCellElement): Promise<TableCellNode[]> {
        const cell = new TableCellNode(item.nodeName === 'TH');
        cell.attributes = this.engine.parseAttributes(item);

        const children = await this.engine.parse(...item.childNodes);
        cell.append(...children);
        return [cell];
    }
}
