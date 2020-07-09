import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { TableCellNode } from './TableCellNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TableCellDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TableCellNode;

    async render(cell: TableCellNode): Promise<DomObject> {
        // If the cell is not active, do not render it (it means it is
        // represented by its manager cell's colspan or rowspan: it was merged).
        if (!cell.isActive()) return { children: [] };

        // Render the cell and its contents.
        const domObject: DomObject = {
            tag: cell.header ? 'TH' : 'TD',
            children: await this.engine.renderChildren(cell),
        };

        // Render attributes.
        // Colspan and rowspan are handled differently from other attributes:
        // they are automatically calculated in function of the cell's managed
        // cells. Render them here. If their value is 1 or less, they are
        // insignificant so no need to render them.
        if (cell.colspan > 1) {
            cell.modifiers.get(Attributes).set('colspan', '' + cell.colspan);
        }
        if (cell.rowspan > 1) {
            cell.modifiers.get(Attributes).set('rowspan', '' + cell.rowspan);
        }
        this.engine.renderAttributes(Attributes, cell, domObject);
        cell.modifiers.get(Attributes).remove('colspan');
        cell.modifiers.get(Attributes).remove('rowspan');

        return domObject;
    }
}
