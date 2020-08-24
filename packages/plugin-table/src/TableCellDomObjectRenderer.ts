import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { TableCellNode } from './TableCellNode';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectNative,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { VRange } from '../../core/src/VRange';
import { Table } from './Table';
import { TableNode } from './TableNode';
import tableEditTemplate from '../assets/tableEdit.xml';

export class TableCellDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TableCellNode;

    async render(cell: TableCellNode): Promise<DomObject> {
        // If the cell is not active, do not render it (it means it is
        // represented by its manager cell's colspan or rowspan: it was merged).
        // TODO: remove `TableNode` check: it's a temporary fix for the memory
        // system, which should not try to render the cell if it's not in the
        // VDocument.
        if (!cell.isActive() || !cell.ancestor(TableNode)) return { children: [] };

        // Render the cell and its contents.
        const domObject: DomObject = {
            tag: cell.header ? 'TH' : 'TD',
            children: await this.engine.renderChildren(cell),
            attributes: {},
        };

        // Colspan and rowspan are handled differently from other attributes:
        // they are automatically calculated in function of the cell's managed
        // cells. Render them here. If their value is 1 or less, they are
        // insignificant so no need to render them.
        if (cell.colspan > 1) {
            domObject.attributes.colspan = cell.colspan.toString();
        }
        if (cell.rowspan > 1) {
            domObject.attributes.rowspan = cell.rowspan.toString();
        }

        // Add buttons.
        const table = this.engine.editor.plugins.get(Table);
        const range = this.engine.editor.selection.range;
        if (table.inlineUI && range.isCollapsed() && range.isIn(cell)) {
            const barContainer = document.createElement('bar-container');
            barContainer.innerHTML = tableEditTemplate;
            const editBar = barContainer.firstElementChild;
            domObject.children.push({ dom: [editBar] });

            this._mapButton(cell, editBar.querySelector('#deleteTable'), 'deleteTable');
            this._mapButton(cell, editBar.querySelector('#addRowAbove'), 'addRowAbove');
            this._mapButton(cell, editBar.querySelector('#addRowBelow'), 'addRowBelow');
            this._mapButton(cell, editBar.querySelector('#deleteRow'), 'deleteRow');
            this._mapButton(cell, editBar.querySelector('#addColumnBefore'), 'addColumnBefore');
            this._mapButton(cell, editBar.querySelector('#addColumnAfter'), 'addColumnAfter');
            this._mapButton(cell, editBar.querySelector('#deleteColumn'), 'deleteColumn');
        }
        return domObject;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Map a button to a command.
     *
     * @param referenceCell
     * @param selector
     * @param commandId
     */
    _mapButton(referenceCell: TableCellNode, deleteTable: HTMLElement, commandId: string): void {
        deleteTable.addEventListener(
            'click',
            async (): Promise<void> =>
                this.engine.editor.execWithRange(VRange.at(referenceCell), commandId),
        );
    }
}
