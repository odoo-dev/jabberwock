import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { TableRowNode } from './TableRowNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class TableRowDomObjectRenderer extends NodeRenderer<DomObject> {
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
        return objectRow;
    }
}
