import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { TableCellNode } from './TableCellNode';
import { nodeName } from '../../utils/src/utils';

export class TableCellDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): item is HTMLTableCellElement => {
        const name = nodeName(item);
        return name === 'TD' || name === 'TH';
    };

    /**
     * Parse a table cell node.
     *
     * @param item
     */
    async parse(item: HTMLTableCellElement): Promise<TableCellNode[]> {
        const cell = new TableCellNode(nodeName(item) === 'TH');
        cell.attributes = this.engine.parseAttributes(item);

        const children = await this.engine.parse(...item.childNodes);
        cell.append(...children);
        return [cell];
    }
}
