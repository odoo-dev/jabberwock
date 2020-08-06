import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { TableCellNode } from './TableCellNode';
import { nodeName } from '../../utils/src/utils';

export class TableCellXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

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
        const cell = new TableCellNode({ header: nodeName(item) === 'TH' });
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            cell.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        cell.append(...children);
        return [cell];
    }
}
