import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import { TableCellNode } from './TableCellNode';
import { nodeName } from '../../utils/src/utils';

export class TableDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): item is HTMLTableElement => {
        return nodeName(item) === 'TABLE';
    };

    /**
     * Parse a table node.
     *
     * @param item
     */
    async parse(item: HTMLTableElement): Promise<TableNode[]> {
        // Parse the table itself and its attributes.
        const table = new TableNode();
        table.attributes = this.engine.parseAttributes(item);

        // Parse the contents of the table.
        const children = await this.engine.parse(...item.childNodes);

        // Build the grid.
        const dimensions = this._getTableDimensions(item);
        const parsedRows = children.filter(row => row.is(TableRowNode)) as TableRowNode[];
        const grid = this._createTableGrid(dimensions, parsedRows);

        // Append the cells to the rows.
        const rows = new Array<TableRowNode>(dimensions[0]);
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
            rows[rowIndex] = parsedRows[rowIndex];
            const cells = grid[rowIndex];
            let row = rows[rowIndex];
            if (!row) {
                row = new TableRowNode();
            }
            row.append(...cells);
        }

        // Append the rows and other children to the table.
        let rowIndex = 0;
        for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
            const child = children[childIndex];
            if (child.is(TableRowNode)) {
                const row = rows[rowIndex];
                table.append(row);
                rowIndex += 1;
            } else {
                table.append(children[childIndex]);
            }
        }
        return [table];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a tuple with the row length and the column length of the given DOM
     * table element.
     *
     * @param domTable
     */
    _getTableDimensions(domTable: HTMLTableElement): [number, number] {
        const domRows = Array.from(domTable.querySelectorAll('tr'));
        let columnCount = 0;
        if (domRows.length) {
            for (const domChild of domRows[0].querySelectorAll('td, th')) {
                columnCount += (domChild as HTMLTableCellElement).colSpan;
            }
        }
        return [domRows.length, columnCount];
    }
    /**
     * Build and return the grid (2D array: rows of cells) that will be used to
     * create the table. We want all the rows to have the same number of cells,
     * and all the columns to have the same number of cells.
     *
     * @param dimensions
     * @param rows
     */
    _createTableGrid(dimensions: [number, number], rows: TableRowNode[]): TableCellNode[][] {
        const [rowCount, columnCount] = dimensions;

        // Initialize the grid (2D array: rows of cells).
        const grid: TableCellNode[][] = Array.from(Array(rowCount), () => new Array(columnCount));

        // Move every parsed child row to its place in the grid, and create
        // placeholder cells where there aren't any, accounting for column spans
        // and row spans.
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
            const row = rows[rowIndex];
            const cells = row.children(TableCellNode).slice();
            for (let domCellIndex = 0; domCellIndex < cells.length; domCellIndex += 1) {
                const cell = cells[domCellIndex];

                // If there is a cell at this grid position already, it means we
                // added it there when handling another cell, ie. it's a
                // placeholder cell, managed by a previously handled cell.
                // The current cell needs to be added at the next available slot
                // instead.
                let columnIndex = domCellIndex;
                while (grid[rowIndex][columnIndex]) {
                    columnIndex += 1;
                }

                // Check traversing colspan and rowspan to insert placeholder
                // cells where necessary. Consume these attributes as they will
                // be replaced with getters.
                const colspan = parseInt(cell.attributes.colspan) || 1;
                const rowspan = parseInt(cell.attributes.rowspan) || 1;
                delete cell.attributes.colspan;
                delete cell.attributes.rowspan;
                for (let i = rowIndex; i < rowIndex + rowspan; i += 1) {
                    for (let j = columnIndex; j < columnIndex + colspan; j += 1) {
                        if (i === rowIndex && j === columnIndex) {
                            // Add the current cell to the grid.
                            grid[i][j] = cell;
                        } else {
                            // Add a placeholder cell to the grid.
                            const placeholderCell = new TableCellNode();
                            placeholderCell.mergeWith(cell);
                            grid[i][j] = placeholderCell;
                        }
                    }
                }
            }
        }
        return grid;
    }
}
