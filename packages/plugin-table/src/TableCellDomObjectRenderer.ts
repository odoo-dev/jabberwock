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
        if (table.inlineUI && this.engine.editor.selection.range.isIn(cell)) {
            // Add row below.
            const rowBelowObject = this._makeButton('addRowBelow', cell, 'fa-plus-square');
            domObject.children.push(rowBelowObject);
            // Delete row.
            const deleteRowObject = this._makeButton('deleteRow', cell, 'fa-minus-square');
            domObject.children.push(deleteRowObject);
            // Add row above.
            const rowAboveObject = this._makeButton('addRowAbove', cell, 'fa-plus-square');
            domObject.children.push(rowAboveObject);

            // Add column before.
            const columnBeforeObject = this._makeButton('addColumnBefore', cell, 'fa-plus-square');
            domObject.children.push(columnBeforeObject);
            // Delete column.
            const deleteColumnObject = this._makeButton('deleteColumn', cell, 'fa-minus-square');
            domObject.children.push(deleteColumnObject);
            // Add column after.
            const columnAfterObject = this._makeButton('addColumnAfter', cell, 'fa-plus-square');
            domObject.children.push(columnAfterObject);

            // Position the buttons.
            domObject.attach = (domNode: Element): void => {
                const box = domNode.getBoundingClientRect();

                const top = window.scrollY + box.top;
                const bottom = window.scrollY + box.top + box.height;
                const middleX = box.left + box.width / 2;
                this._positionButton(rowAboveObject, top, middleX - 9);
                this._positionButton(deleteRowObject, top, middleX + 9);
                this._positionButton(rowBelowObject, bottom, middleX);

                const middleY = window.scrollY + box.top + box.height / 2;
                const left = box.left;
                const right = box.left + box.width;
                this._positionButton(columnBeforeObject, middleY - 9, left);
                this._positionButton(deleteColumnObject, middleY + 9, left);
                this._positionButton(columnAfterObject, middleY, right);
            };
        }
        return domObject;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Create a DomObjectNative representing a button that executes the give
     * command with a range at the given reference cell. If `remove` is true,
     * make a "minus" button. Otherwise, make it a "plus" button.
     *
     * @param commandId
     * @param referenceCell
     * @param faClass
     */
    _makeButton(commandId: string, referenceCell: TableCellNode, faClass: string): DomObjectNative {
        const rowAboveButton = document.createElement('span');
        rowAboveButton.className = 'fa ' + faClass + ' fa-fw table-handler';
        const rowAboveObject: DomObjectNative = { dom: [rowAboveButton] };
        const callback = async (): Promise<void> =>
            this.engine.editor.execWithRange(VRange.at(referenceCell), commandId);
        rowAboveObject.attach = (...domNodes: Node[]): void => {
            for (const domNode of domNodes) {
                domNode.addEventListener('click', callback);
            }
        };
        rowAboveObject.detach = (...domNodes: Node[]): void => {
            for (const domNode of domNodes) {
                domNode.removeEventListener('click', callback);
            }
        };
        return rowAboveObject;
    }
    /**
     * Position the button represented by a DomObjectNative at the given top and
     * left coordinates, taking into account the dimensions of the button
     * itself.
     *
     * @param buttonObject
     * @param top
     * @param left
     */
    _positionButton(buttonObject: DomObjectNative, top: number, left: number): void {
        const button = buttonObject.dom[0] as HTMLElement;
        const buttonBox = button.getBoundingClientRect();
        button.style.top = top - buttonBox.height / 2 + 'px';
        button.style.left = left - buttonBox.width / 2 + 'px';
    }
}
