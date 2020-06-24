import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { TableSectionAttributes } from './TableRowXmlDomParser';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TableDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TableNode;

    /**
     * Render the TableNode along with its contents (TableRowNodes).
     */
    async render(table: TableNode): Promise<DomObject> {
        const objectTable: DomObject = {
            tag: 'TABLE',
            children: [],
        };
        const objectHead: DomObject = {
            tag: 'THEAD',
            children: [],
        };
        let objectBody: DomObject = {
            tag: 'TBODY',
            children: [],
        };

        for (const child of table.children()) {
            if (child.is(TableRowNode)) {
                // If the child is a row, append it to its containing section.
                const tableSection = child.header ? objectHead : objectBody;
                tableSection.children.push(child);
                this.engine.renderAttributes(TableSectionAttributes, child, tableSection);
                if (!objectTable.children.includes(tableSection)) {
                    objectTable.children.push(tableSection);
                }
            } else {
                objectTable.children.push(child);
                // Create a new <tbody> so the rest of the rows, if any, get
                // appended to it, after this element.
                objectBody = {
                    tag: 'TBODY',
                    children: [],
                };
            }
        }
        this.engine.renderAttributes(Attributes, table, objectTable);
        return objectTable;
    }
}
