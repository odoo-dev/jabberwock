import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { TableRowNode } from './TableRowNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TableRowDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TableRowNode;

    /**
     * Render the TableRowNode along with its contents.
     */
    async render(row: TableRowNode): Promise<DomObject> {
        const objectRow: DomObject = {
            tag: 'TR',
            children: row.children(),
        };
        this.engine.renderAttributes(Attributes, row, objectRow);
        return objectRow;
    }
}
