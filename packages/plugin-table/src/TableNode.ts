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
}
