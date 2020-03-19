import { VElement } from '../../core/src/VNodes/VElement';
import { TableRowNode } from './TableRowNode';
import { TableCellNode } from './TableCellNode';

export class TableNode extends VElement {
    constructor() {
        super('TABLE');
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    get name(): string {
        return super.name + ': ' + this.rowCount + 'x' + this.columnCount;
    }
    /**
     * Return an array of rows in this table, as arrays of cells.
     */
    get rows(): TableCellNode[][] {
        return this.children(TableRowNode).map(row => row.children(TableCellNode));
    }
    /**
     * Return an array of columns in this table, as arrays of cells.
     */
    get columns(): TableCellNode[][] {
        const columns = new Array(this.columnCount).fill(undefined);
        return columns.map((_, columnIndex) =>
            this.children(TableRowNode).map(row => row.children(TableCellNode)[columnIndex]),
        );
    }
    /**
     * Return the number of rows in this table.
     */
    get rowCount(): number {
        return this.children(TableRowNode).length;
    }
    /**
     * Return the number of columns in this table.
     */
    get columnCount(): number {
        return this.firstChild(TableRowNode).children(TableCellNode).length;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return the cell of this table that can be found at the given coordinates,
     * if any.
     *
     * @param rowIndex
     * @param columnIndex
     */
    getCellAt(rowIndex: number, columnIndex: number): TableCellNode {
        return this.children(TableRowNode)[rowIndex].children(TableCellNode)[columnIndex];
    }
    /**
     * Add a new row above the reference row (the row of the given reference
     * cell). Copy the styles and colspans of the cells of the reference row. If
     * the reference row traverses a rowspan, extend that rowspan.
     *
     * @param referenceCell
     */
    addRowAbove(referenceCell: TableCellNode): void {
        const referenceRow = referenceCell.ancestor(TableRowNode);
        const newRow = referenceRow.clone();
        referenceRow.before(newRow);
        for (const cell of referenceRow.children(TableCellNode)) {
            const clone = cell.clone();
            newRow.append(clone);

            // Handle managers.
            const manager = cell.managerCell;
            if (manager) {
                if (manager.rowIndex === referenceRow.rowIndex) {
                    // If the current cell's manager is in the reference row,
                    // the clone's manager should be that manager's clone.
                    const managerClone = this.getCellAt(newRow.rowIndex, manager.columnIndex);
                    clone.mergeWith(managerClone);
                } else {
                    clone.mergeWith(manager);
                }
            }
        }
    }
    /**
     * Add a new row below the reference row (the row of the given reference
     * cell). Copy the styles and colspans of the cells of the reference row. If
     * the reference row traverses a rowspan, extend that rowspan.
     * Note: a rowspan ending at the reference cell is not extended.
     *
     * @param referenceCell
     */
    addRowBelow(referenceCell: TableCellNode): void {
        const rowIndex = referenceCell.rowIndex + referenceCell.rowspan - 1;
        const referenceRow = this.children(TableRowNode)[rowIndex];
        const newRow = referenceRow.clone();
        referenceRow.after(newRow);
        for (const cell of referenceRow.children(TableCellNode)) {
            const clone = cell.clone();
            newRow.append(clone);

            // Handle managers.
            if (cell.managerCell) {
                const manager = cell.managerCell;
                const managerEndRow = manager.rowIndex + manager.rowspan - 1;
                if (managerEndRow === rowIndex && manager.columnIndex !== cell.columnIndex) {
                    // Take the new row equivalent of the above cell's manager
                    // (copy colspan).
                    clone.mergeWith(this.getCellAt(newRow.rowIndex, manager.columnIndex));
                } else if (managerEndRow !== rowIndex) {
                    // Take the manager cell of the above cell (extend rowspan),
                    // only if said manager's rowspan is not ending with the
                    // above cell.
                    clone.mergeWith(manager);
                }
            } else if (cell.rowspan > 1) {
                // If the cell has a rowspan, extend it.
                clone.mergeWith(cell);
            }
        }
    }
    /**
     * Add a new column before the reference column (the column of the given
     * reference cell). Copy the styles and rowspans of the cells of the
     * reference column. If the reference column traverses a colspan, extend
     * that colspan.
     *
     * @param referenceCell
     */
    addColumnBefore(referenceCell: TableCellNode): void {
        const referenceColumn = referenceCell.column;
        for (const cell of referenceColumn) {
            const clone = cell.clone();
            cell.before(clone);

            // Handle managers.
            const manager = cell.managerCell;
            if (manager) {
                if (manager.columnIndex === referenceCell.columnIndex) {
                    // If the current cell's manager is in the reference column,
                    // the clone's manager should be that manager's clone.
                    const managerClone = this.getCellAt(manager.rowIndex, clone.columnIndex);
                    clone.mergeWith(managerClone);
                } else {
                    clone.mergeWith(manager);
                }
            }
        }
    }
    /**
     * Add a new column after the reference column (the column of the given
     * reference cell). Copy the styles and rowspans of the cells of the
     * reference column. If the reference column traverses a colpan, extend that
     * colspan.
     * Note: a colspan ending at the reference cell is not extended.
     *
     * @param referenceCell
     */
    addColumnAfter(referenceCell: TableCellNode): void {
        const columnIndex = referenceCell.columnIndex + referenceCell.colspan - 1;
        const referenceColumn = this.columns[columnIndex];
        for (const cell of referenceColumn) {
            const clone = cell.clone();
            cell.after(clone);

            // Handle managers.
            if (cell.managerCell) {
                const manager = cell.managerCell;
                const managerEndColumn = manager.columnIndex + manager.colspan - 1;
                if (managerEndColumn === columnIndex && manager.rowIndex !== cell.rowIndex) {
                    // Take the new column equivalent of the previous cell's
                    // manager (copy rowspan).
                    clone.mergeWith(this.getCellAt(manager.rowIndex, clone.columnIndex));
                } else if (managerEndColumn !== columnIndex) {
                    // Take the manager cell of the previous cell (extend
                    // colspan), only if said manager's colspan is not ending
                    // with the previous cell.
                    clone.mergeWith(manager);
                }
            } else if (cell.colspan > 1) {
                // If the cell has a colspan, extend it.
                clone.mergeWith(cell);
            }
        }
    }
}
