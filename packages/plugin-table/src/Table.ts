import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { TableXmlDomParser } from './TableXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { TableRowXmlDomParser } from './TableRowXmlDomParser';
import { TableCellXmlDomParser } from './TableCellXmlDomParser';
import { TableDomObjectRenderer } from './TableDomObjectRenderer';
import { TableRowDomObjectRenderer } from './TableRowDomObjectRenderer';
import { TableCellDomObjectRenderer } from './TableCellDomObjectRenderer';
import { TableSectionAttributesDomObjectModifierRenderer } from './TableSectionAttributesDomObjectModifierRenderer';
import { TableCellMailObjectRenderer } from './TableCellMailObjectRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { TableCellNode } from './TableCellNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { TableNode } from './TableNode';
import { distinct } from '../../utils/src/utils';
import { TableRowNode } from './TableRowNode';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { TablePickerDomObjectRenderer } from './TablePickerDomObjectRenderer';
import { TablePickerCellDomObjectRenderer } from './TablePickerCellDomObjectRenderer';
import { TablePickerNode } from './TablePickerNode';
import '../assets/tableUI.css';

export interface TableConfig extends JWPluginConfig {
    minRowCount?: number;
    minColumnCount?: number;
    inlineUI?: boolean;
}
export interface InsertTableParams extends CommandParams {
    rowCount?: number;
    columnCount?: number;
}

export class Table<T extends TableConfig = TableConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer & Keymap & Layout> = {
        parsers: [TableXmlDomParser, TableRowXmlDomParser, TableCellXmlDomParser],
        renderers: [
            TablePickerDomObjectRenderer,
            TablePickerCellDomObjectRenderer,
            TableDomObjectRenderer,
            TableRowDomObjectRenderer,
            TableCellDomObjectRenderer,
            TableCellMailObjectRenderer,
            TableSectionAttributesDomObjectModifierRenderer,
        ],
        components: [
            {
                id: 'TableButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'tableButton',
                        label: 'Pick the size of the table you want to insert',
                        commandId: 'insertTable',
                        selected: (editor: JWEditor): boolean =>
                            editor.plugins.get(Table).isTablePickerOpen,
                        modifiers: [new Attributes({ class: 'fa fa-table fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'TablePicker',
                async render(editor: JWEditor): Promise<TablePickerNode[]> {
                    const tablePlugin = editor.plugins.get(Table);
                    const table = new TablePickerNode({
                        rowCount: tablePlugin.minRowCount,
                        columnCount: tablePlugin.minColumnCount,
                    });
                    return [table];
                },
            },
        ],
        componentZones: [['TableButton', ['actionables']]],
    };
    commands = {
        insertTable: {
            handler: this.insertTable.bind(this),
        },
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
    isTablePickerOpen = false;
    /**
     * The minimum row count for the table picker (default: 5).
     */
    minRowCount = 5;
    /**
     * The minimum column count for the table picker (default: 5).
     */
    minColumnCount = 5;
    /**
     * If true, add UI buttons inline in the table on render to add/remove
     * columns/rows.
     */
    inlineUI = false;
    constructor(public editor: JWEditor, public config: T) {
        super(editor, config);
        if (config.minRowCount) {
            this.minRowCount = config.minRowCount;
        }
        if (config.minColumnCount) {
            this.minColumnCount = config.minColumnCount;
        }
        this.inlineUI = !!config.inlineUI;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a table at range. If no dimensions are given for the table, open
     * the table picker in order to ask the user for dimensions.
     *
     * @param params
     */
    async insertTable(params: InsertTableParams): Promise<void> {
        const layout = this.editor.plugins.get(Layout);
        if (this.isTablePickerOpen) {
            await layout.remove('TablePicker');
        }
        if (!params.rowCount || !params.columnCount) {
            this.editor.memoryInfo.uiCommand = true;
            if (!this.isTablePickerOpen) {
                await layout.append('TablePicker', 'TableButton');
            }
        } else {
            const range = params.context.range;
            range.empty();
            if (range.startContainer) {
                const table = new TableNode(params);
                range.start.before(table);
                table.firstLeaf().prepend(range.start);
                range.collapse();
            }
        }
    }
    /**
     * Add a row above the cell at given range start.
     *
     * @param params
     */
    addRowAbove(params: CommandParams): void {
        const range = params.context.range;
        const cell = range.start.ancestor(TableCellNode);
        if (!cell) return;

        cell.ancestor(TableNode).addRowAbove(cell);
    }
    /**
     * Add a row below the cell at given range start.
     *
     * @param params
     */
    addRowBelow(params: CommandParams): void {
        const range = params.context.range;
        const row = range.start.ancestor(TableCellNode);
        if (!row) return;

        row.ancestor(TableNode).addRowBelow(row);
    }
    /**
     * Add a column before the cell at given range start.
     *
     * @param params
     */
    addColumnBefore(params: CommandParams): void {
        const range = params.context.range;
        const cell = range.start.ancestor(TableCellNode);
        if (!cell) return;

        cell.ancestor(TableNode).addColumnBefore(cell);
    }
    /**
     * Add a column after the cell at given range start.
     *
     * @param params
     */
    addColumnAfter(params: CommandParams): void {
        const range = params.context.range;
        const cell = range.start.ancestor(TableCellNode);
        if (!cell) return;

        cell.ancestor(TableNode).addColumnAfter(cell);
    }
    /**
     * Delete the row at given range start.
     *
     * @param params
     */
    deleteRow(params: CommandParams): void {
        const range = params.context.range;
        const cell = range.start.ancestor(TableCellNode);
        if (!cell) return;

        const row = cell.ancestor(TableRowNode);
        const nextRow = row.nextSibling(TableRowNode) || row.previousSibling(TableRowNode);
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
            row.remove();

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
        const cell = range.start.ancestor(TableCellNode);
        if (!cell) return;

        const column = cell.column;
        const nextCell = cell.nextSibling(TableCellNode) || cell.previousSibling(TableCellNode);

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
                cell.remove();

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
        const table = range.start.ancestor(TableNode);
        if (!table) return;

        const nextSibling = table.nextSibling();
        const previousSibling = table.previousSibling();
        if (nextSibling) {
            range.setStart(nextSibling.firstLeaf(), RelativePosition.BEFORE);
            range.collapse();
        } else if (previousSibling) {
            range.setStart(previousSibling.lastLeaf(), RelativePosition.AFTER);
            range.collapse();
        }
        table.remove();
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
