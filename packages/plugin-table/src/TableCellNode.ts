import { VNode } from '../../core/src/VNodes/VNode';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';

export interface TableCellAttributes extends Record<string, string | Record<string, string>> {
    colspan?: string;
    rowspan?: string;
}

export class TableCellNode extends VNode {
    attributes: TableCellAttributes;
    // Only the `managerCell` setter should modify the following private keys.
    __managerCell: TableCellNode;
    __managedCells = new Set<TableCellNode>();

    constructor(public header = false) {
        super();
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(): this {
        const clone = new this.constructor<typeof TableCellNode>(this.header);
        clone.attributes = { ...this.attributes };
        return clone;
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    get name(): string {
        let coordinatesRepr = ' <(' + this.rowIndex + ', ' + this.columnIndex + ')';
        if (this.colspan > 1 || this.rowspan > 1) {
            const endRow = this.rowIndex + this.rowspan - 1;
            const endColumn = this.columnIndex + this.colspan - 1;
            coordinatesRepr += ':(' + endRow + ', ' + endColumn + ')';
        }
        coordinatesRepr += '>';
        return (
            super.name +
            coordinatesRepr +
            (this.header ? ': header' : '') +
            (this.isActive() ? '' : ' (inactive)')
        );
    }
    /**
     * Return the cell that manages this cell, if any.
     */
    get managerCell(): TableCellNode {
        return this.__managerCell;
    }
    /**
     * Set the given cell as manager of this cell. If null is passed, this cell
     * will have no manager.
     */
    set managerCell(newManager: TableCellNode | null) {
        const oldManager = this.__managerCell;
        this.__managerCell = newManager;

        if (newManager) {
            // If we just set a new manager for this cell, also add this cell to
            // the new manager's managed cells.
            newManager.__managedCells.add(this);

            // Copy the manager's attributes and properties.
            this.attributes = { ...newManager.attributes };
            this.header = newManager.header;

            // Move the children to the manager.
            newManager.append(...this.children);

            // Hand the managed cells over to the manager.
            for (const managedCell of this.managedCells) {
                managedCell.managerCell = newManager;
                this.__managedCells.delete(managedCell);
            }
        } else if (oldManager) {
            // If we just removed this cell's manager, also remove this cell
            // from the old manager's managed cells.
            oldManager.__managedCells.delete(this);
        }
    }
    /**
     * Return the set of cells that this cell manages.
     */
    get managedCells(): Set<TableCellNode> {
        return new Set(this.__managedCells);
    }
    /**
     * Return the computed column span of this cell, in function of its managed
     * cells.
     */
    get colspan(): number {
        const cellsArray = Array.from(this.managedCells);
        const sameRowCells = cellsArray.filter(cell => cell.rowIndex === this.rowIndex);
        return 1 + sameRowCells.length;
    }
    /**
     * Return the computed row span of this cell, in function of its managed
     * cells.
     */
    get rowspan(): number {
        const cellsArray = Array.from(this.managedCells);
        const sameColumnCells = cellsArray.filter(cell => cell.columnIndex === this.columnIndex);
        return 1 + sameColumnCells.length;
    }
    /**
     * Return the row to which this cell belongs.
     */
    get row(): TableCellNode[] {
        return this.ancestor(TableRowNode).children(TableCellNode);
    }
    /**
     * Return the column to which this cell belongs, as an array of cells.
     */
    get column(): TableCellNode[] {
        return this.ancestor(TableNode).columns[this.columnIndex];
    }
    /**
     * Return the index of the row to which this cell belongs.
     */
    get rowIndex(): number {
        return this.ancestor(TableRowNode).rowIndex;
    }
    /**
     * Return the index of the column to which this cell belongs.
     */
    get columnIndex(): number {
        return this.parent.children(TableCellNode).indexOf(this);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if this cell is active (ie not managed by another cell).
     */
    isActive(): boolean {
        return !this.managerCell;
    }
}
