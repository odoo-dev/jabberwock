import { VNode } from '../../core/src/VNodes/VNode';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import {
    AbstractNodeParams,
    isNodePredicate,
    ancestorNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

export interface TableCellNodeParams extends AbstractNodeParams {
    header: boolean;
}
import { VersionableSet } from '../../core/src/Memory/VersionableSet';

export class TableCellNode extends ContainerNode {
    breakable = false;
    header: boolean;
    // Only the `managerCell` setter should modify the following private keys.
    __managerCell: TableCellNode;
    __managedCells = new VersionableSet<TableCellNode>();

    constructor(params?: TableCellNodeParams) {
        super(params);
        this.header = params?.header || false;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof TableCellNode>[0] = {
            header: this.header,
        };
        return super.clone(deepClone, { ...defaults, ...params });
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
        return ancestorNodeTemp(this, TableRowNode).children(TableCellNode);
    }
    /**
     * Return the column to which this cell belongs, as an array of cells.
     */
    get column(): TableCellNode[] {
        return ancestorNodeTemp(this, TableNode).columns[this.columnIndex];
    }
    /**
     * Return the index of the row to which this cell belongs.
     */
    get rowIndex(): number {
        return ancestorNodeTemp(this, TableRowNode).rowIndex;
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
    /**
     * Set the given cell as manager of this cell.
     * Note: A cell managed by another cell also copies its manager's attributes
     * and properties and hands over its children to its manager.
     *
     * @override
     */
    mergeWith(newManager: VNode): void {
        const thisTable = ancestorNodeTemp(this, TableNode);
        const otherTable = ancestorNodeTemp(newManager, TableNode);
        if (!isNodePredicate(newManager, TableCellNode) || thisTable !== otherTable) return;

        this.__managerCell = newManager;
        newManager.manage(this);
    }
    /**
     * Unmerge this cell from its manager.
     */
    unmerge(): void {
        const manager = this.__managerCell;
        if (manager) {
            this.__managerCell = null;
            // If we just removed this cell's manager, also remove this cell
            // from the old manager's managed cells.
            manager.unmanage(this);
        }
    }
    /**
     * Set the given cell as managed by this cell.
     * Note: A cell managed by another cell also copies its manager's modifiers
     * and properties and hands over its children to its manager.
     *
     * @param cell
     */
    manage(cell: TableCellNode): void {
        this.__managedCells.add(cell);

        // Copy the manager's modifiers and properties.
        cell.modifiers = this.modifiers.clone();
        cell.header = this.header;

        // Move the children to the manager.
        this.append(...cell.childVNodes);

        // Hand the managed cells over to the manager.
        for (const managedCell of cell.managedCells) {
            managedCell.mergeWith(this);
            cell.unmanage(managedCell);
        }

        // Copy the manager's row if an entire row was merged
        const row = ancestorNodeTemp(cell, TableRowNode);
        if (row) {
            const cells = row.children(TableCellNode);
            const rowIsMerged = cells.every(rowCell => rowCell.managerCell === this);
            if (rowIsMerged) {
                const managerRow = ancestorNodeTemp(cell.managerCell, TableRowNode);
                row.header = managerRow.header;
                row.modifiers = managerRow.modifiers.clone();
            }
        }

        // Ensure reciprocity.
        if (cell.managerCell !== this) {
            cell.mergeWith(this);
        }
    }
    /**
     * Restore the independence of the given cell.
     *
     * @param cell
     */
    unmanage(cell: TableCellNode): void {
        this.__managedCells.delete(cell);

        // Ensure reciprocity.
        if (cell.managerCell === this) {
            cell.unmerge();
        }
    }
}
