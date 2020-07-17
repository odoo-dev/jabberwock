import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { TableXmlDomParser } from './TableXmlDomParser';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { TableRowXmlDomParser } from './TableRowXmlDomParser';
import { TableCellXmlDomParser } from './TableCellXmlDomParser';
import { TableDomObjectRenderer } from './TableDomObjectRenderer';
import { TableRowDomObjectRenderer } from './TableRowDomObjectRenderer';
import { TableCellDomObjectRenderer } from './TableCellDomObjectRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { TableCellNode } from './TableCellNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { TableNode } from './TableNode';
import { distinct } from '../../utils/src/utils';
import { TableRowNode } from './TableRowNode';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { removeNodeTemp } from '../../core/src/VNodes/AbstractNode';
import {
    ancestorNodeTemp,
    previousSiblingNodeTemp,
    nextSiblingNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

export class Table<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer & Keymap> = {
        parsers: [TableXmlDomParser, TableRowXmlDomParser, TableCellXmlDomParser],
        renderers: [TableDomObjectRenderer, TableRowDomObjectRenderer, TableCellDomObjectRenderer],
        shortcuts: [
            {
                pattern: 'CTRL+<Slash>',
                commandId: 'addRowBelow',
            },
            {
                pattern: 'CTRL+SHIFT+<Slash>',
                commandId: 'addRowAbove',
            },
            {
                pattern: 'CTRL+<Equal>',
                commandId: 'addColumnAfter',
            },
            {
                pattern: 'CTRL+SHIFT+<Equal>',
                commandId: 'addColumnBefore',
            },
            {
                pattern: 'CTRL+SHIFT+DELETE',
                commandId: 'deleteRow',
            },
            {
                pattern: 'CTRL+SHIFT+BACKSPACE',
                commandId: 'deleteColumn',
            },
            {
                pattern: 'CTRL+ALT+SHIFT+DELETE',
                commandId: 'deleteTable',
            },
            {
                pattern: 'CTRL+<Period>',
                commandId: 'mergeCells',
            },
            {
                pattern: 'CTRL+SHIFT+<Period>',
                commandId: 'unmergeCells',
            },
        ],
    };
    commands = {
        addRowAbove: {
            handler: this.addRowAbove.bind(this),
        },
        addRowBelow: {
            handler: this.addRowBelow.bind(this),
        },
        addColumnBefore: {
            handler: this.addColumnBefore.bind(this),
        },
        addColumnAfter: {
            handler: this.addColumnAfter.bind(this),
        },
        deleteRow: {
            handler: this.deleteRow.bind(this),
        },
        deleteColumn: {
            handler: this.deleteColumn.bind(this),
        },
        deleteTable: {
            handler: this.deleteTable.bind(this),
        },
        mergeCells: {
            handler: this.mergeCells.bind(this),
        },
        unmergeCells: {
            handler: this.unmergeCells.bind(this),
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a row above the cell at given range start.
     *
     * @param params
     */
    addRowAbove(params: CommandParams): void {
        const range = params.context.range;
        const cell = ancestorNodeTemp(range.start, TableCellNode);
        if (!cell) return;

        ancestorNodeTemp(cell, TableNode).addRowAbove(cell);
    }
    /**
     * Add a row below the cell at given range start.
     *
     * @param params
     */
    addRowBelow(params: CommandParams): void {
        const range = params.context.range;
        const row = ancestorNodeTemp(range.start, TableCellNode);
        if (!row) return;

        ancestorNodeTemp(row, TableNode).addRowBelow(row);
    }
    /**
     * Add a column before the cell at given range start.
     *
     * @param params
     */
    addColumnBefore(params: CommandParams): void {
        const range = params.context.range;
        const cell = ancestorNodeTemp(range.start, TableCellNode);
        if (!cell) return;

        ancestorNodeTemp(cell, TableNode).addColumnBefore(cell);
    }
    /**
     * Add a column after the cell at given range start.
     *
     * @param params
     */
    addColumnAfter(params: CommandParams): void {
        const range = params.context.range;
        const cell = ancestorNodeTemp(range.start, TableCellNode);
        if (!cell) return;

        ancestorNodeTemp(cell, TableNode).addColumnAfter(cell);
    }
    /**
     * Delete the row at given range start.
     *
     * @param params
     */
    deleteRow(params: CommandParams): void {
        const range = params.context.range;
        const cell = ancestorNodeTemp(range.start, TableCellNode);
        if (!cell) return;

        const row = ancestorNodeTemp(cell, TableRowNode);
        const nextRow =
            nextSiblingNodeTemp(row, TableRowNode) || previousSiblingNodeTemp(row, TableRowNode);
        const nextCell = nextRow && nextRow.children(TableCellNode)[cell.columnIndex];

        if (nextCell) {
            const nextRowIndex = nextCell.rowIndex;

            // Handle rowspans.
            const cells = row.children(TableCellNode);
            for (const cell of cells) {
                if (cell.rowspan > 1) {
                    // Cells managed by this cell will now be managed by the
                    // cell below (or above if there is none below) instead.
                    const belowCell = Array.from(cell.managedCells).find(
                        managedCell => managedCell.rowIndex === nextRowIndex,
                    );
                    if (belowCell) {
                        belowCell.unmerge();
                        for (const managedCell of cell.managedCells) {
                            if (managedCell !== belowCell) {
                                managedCell.mergeWith(belowCell);
                            }
                        }
                    }
                } else if (!cell.isActive()) {
                    // If this cell is inactive, unmerge it so its manager
                    // doesn't believe it still manages it.
                    cell.unmerge();
                }
            }
            // Remove the row.
            removeNodeTemp(row);

            // The place where the range used to live was just demolished. Give
            // it shelter within the next active cell.
            const nextActiveCell = nextCell.managerCell || nextCell;
            range.setStart(nextActiveCell.firstLeaf(), RelativePosition.BEFORE);
            range.collapse();
        } else {
            // If there is no `nextCell`, we're trying to delete the only row in
            // this table so just remove the table.
            this.deleteTable(params);
        }
    }
    /**
     * Delete the column at given range start.
     *
     * @param params
     */
    deleteColumn(params: CommandParams): void {
        const range = params.context.range;
        const cell = ancestorNodeTemp(range.start, TableCellNode);
        if (!cell) return;

        const column = cell.column;
        const nextCell =
            nextSiblingNodeTemp(cell, TableCellNode) ||
            previousSiblingNodeTemp(cell, TableCellNode);

        if (nextCell) {
            const nextColumnIndex = nextCell.columnIndex;

            // Handle colspans and cell removal.
            for (const cell of column) {
                if (cell.colspan > 1) {
                    // Cells managed by this cell will now be managed by the
                    // cell after (or before if there is none after) instead.
                    const afterCell = Array.from(cell.managedCells).find(
                        managedCell => managedCell.columnIndex === nextColumnIndex,
                    );
                    if (afterCell) {
                        afterCell.unmerge();
                        for (const managedCell of cell.managedCells) {
                            if (managedCell !== afterCell) {
                                managedCell.mergeWith(afterCell);
                            }
                        }
                    }
                } else if (!cell.isActive()) {
                    // If this cell is inactive, unmerge it so its manager
                    // doesn't believe it still manages it.
                    cell.unmerge();
                }
                // Remove the cell.
                removeNodeTemp(cell);

                // The place where the range used to live was just demolished.
                // Give it shelter within the next active cell.
                const nextManagerCell = nextCell.managerCell || nextCell;
                range.setStart(nextManagerCell.firstLeaf(), RelativePosition.BEFORE);
                range.collapse();
            }
        } else {
            // If there is no `nextCell`, we're trying to delete the only column
            // in this table so just remove the table.
            this.deleteTable(params);
        }
    }
    /**
     * Delete the table at given range start.
     *
     * @param params
     */
    deleteTable(params: CommandParams): void {
        const range = params.context.range;
        const table = ancestorNodeTemp(range.start, TableNode);
        if (!table) return;

        const nextSibling = nextSiblingNodeTemp(table);
        const previousSibling = previousSiblingNodeTemp(table);
        if (nextSibling) {
            range.setStart(nextSibling.firstLeaf(), RelativePosition.BEFORE);
            range.collapse();
        } else if (previousSibling) {
            range.setStart(previousSibling.lastLeaf(), RelativePosition.AFTER);
            range.collapse();
        }
        removeNodeTemp(table);
    }
    /**
     * Merge the cells at given range into the first cell at given range.
     *
     * @param params
     */
    mergeCells(params: CommandParams): void {
        const range = params.context.range;
        const cells = range.targetedNodes(TableCellNode);
        if (this._isRectangle(cells)) {
            // Only merge the cells if they would not imply to merge
            // unrelated cells, ie. the selected cells form a rectangle.
            const managerCell = cells.shift();
            const Separator = this.editor.configuration.defaults.Separator;
            for (const cell of cells) {
                if (managerCell.hasChildren()) {
                    managerCell.append(new Separator());
                }
                cell.mergeWith(managerCell);
            }
        }
    }
    /**
     * Unmerge previously merged cells at given range.
     *
     * @param params
     */
    unmergeCells(params: CommandParams): void {
        const range = params.context.range;
        const cells = range.targetedNodes(TableCellNode);
        for (const cell of cells) {
            for (const managedCell of cell.managedCells) {
                managedCell.unmerge();
            }
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given array of cells forms a rectangle in the table
     * grid.
     *
     * @param cells
     */
    _isRectangle(cells: TableCellNode[]): boolean {
        cells = [...cells];

        // Add managed cells to the list.
        for (const cell of [...cells]) {
            if (cell.managedCells.size) {
                cells.push(...cell.managedCells);
            }
        }
        cells = distinct(cells);

        // Compute the row/column index extrema.
        const rowIndices = cells.map(cell => cell.rowIndex);
        const columnIndices = cells.map(cell => cell.columnIndex);
        const minRowIndex = Math.min(...rowIndices);
        const minColumnIndex = Math.min(...columnIndices);
        const maxRowIndex = Math.max(...rowIndices);
        const maxColumnIndex = Math.max(...columnIndices);

        // If a cell between the extrema cannot be found in the list, the
        // selected cells do not form a rectangle.
        for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
            for (let columnIndex = minColumnIndex; columnIndex <= maxColumnIndex; columnIndex++) {
                const cell = cells.find(cell => {
                    return cell.rowIndex === rowIndex && cell.columnIndex === columnIndex;
                });
                if (!cell) {
                    return false;
                }
            }
        }

        return true;
    }
}
