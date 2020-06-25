import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import { TableCellNode } from './TableCellNode';
import { nodeName } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TableXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

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
        table.modifiers.append(this.engine.parseAttributes(item));

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
        const domTableRows = domRows.filter(row => row.closest('table') === domTable);
        let columnCount = 0;
        if (domTableRows.length) {
            const domCells = Array.from(domTableRows[0].querySelectorAll('td, th'));
            const domTableCells = domCells.filter(cell => cell.closest('table') === domTable);
            for (const domChild of domTableCells) {
                columnCount += parseInt(domChild.getAttribute('colSpan') || '1', 10);
            }
        }
        return [domTableRows.length, columnCount];
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
                const attributes = cell.modifiers.find(Attributes);
                let colspan = 1;
                let rowspan = 1;
                if (attributes) {
                    colspan = parseInt(attributes.get('colspan'), 10) || 1;
                    rowspan = parseInt(attributes.get('rowspan'), 10) || 1;
                    attributes.remove('colspan');
                    attributes.remove('rowspan');
                }
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

        // Insert empty cells in every undefined element of the grid.
        return grid.map(row => Array.from(row, cell => cell || new TableCellNode()));
    }
}
