import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObject,
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { TableCellNode } from './TableCellNode';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Table } from './Table';
import { TablePickerNode } from './TablePickerNode';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class TablePickerCellDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof TableCellNode && node.parent?.parent instanceof TablePickerNode;

    async render(
        tablePickerCell: TableCellNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectElement> {
        const domObject = (await this.super.render(tablePickerCell, worker)) as DomObjectElement;
        domObject.attributes = {
            ...domObject.attributes,
            ...{
                'data-rowCount': '' + (tablePickerCell.rowIndex + 1),
                'data-columnCount': '' + (tablePickerCell.columnIndex + 1),
            },
        };
        const tablePlugin = this.engine.editor.plugins.get(Table);
        const minRowCount = tablePlugin.minRowCount;
        const minColumnCount = tablePlugin.minColumnCount;

        const onMouseOver = (ev: Event): void => {
            const table = (ev.target as HTMLTableCellElement).closest('table.table-picker');
            for (const cell of table.querySelectorAll('td')) {
                const rowIndex = +cell.getAttribute('data-rowCount') - 1;
                const columnIndex = +cell.getAttribute('data-columnCount') - 1;
                if (
                    rowIndex <= tablePickerCell.rowIndex &&
                    columnIndex <= tablePickerCell.columnIndex
                ) {
                    cell.classList.add('highlight');
                } else {
                    cell.classList.remove('highlight');
                }
            }
            const tablePicker = tablePickerCell.ancestor(TableNode);
            if (
                tablePickerCell.rowIndex >= tablePicker.rowCount - 1 ||
                tablePicker.rowCount > minRowCount ||
                tablePickerCell.columnIndex >= tablePicker.columnCount - 1 ||
                tablePicker.columnCount > minColumnCount
            ) {
                this.engine.editor.execCommand(() => {
                    this.engine.editor.memoryInfo.uiCommand = true;

                    const toRedraw = new Set<VNode>();
                    // Add/remove rows.
                    if (tablePickerCell.rowIndex >= tablePicker.rowCount - 1) {
                        // Add.
                        const newRow = new TableRowNode();
                        toRedraw.add(newRow);
                        tablePicker.append(newRow);
                        for (let cellIndex = 0; cellIndex < tablePicker.columnCount; cellIndex++) {
                            const newCell = new TableCellNode();
                            newRow.append(newCell);
                            toRedraw.add(newCell);
                        }
                    } else if (tablePicker.rowCount > minRowCount) {
                        // Remove.
                        const rows = tablePicker.children(
                            child =>
                                child instanceof TableRowNode &&
                                child.rowIndex >= minRowCount &&
                                child.rowIndex > tablePickerCell.rowIndex + 1,
                        );
                        for (const row of rows) {
                            for (const rowCell of row.children(TableCellNode)) {
                                rowCell.remove();
                            }
                            row.remove();
                        }
                        if (rows.length) toRedraw.add(tablePicker);
                    }
                    // Add/remove Columns.
                    if (tablePickerCell.columnIndex >= tablePicker.columnCount - 1) {
                        // Add.
                        for (const row of tablePicker.children(TableRowNode)) {
                            const newCell = new TableCellNode();
                            row.append(newCell);
                            toRedraw.add(newCell);
                        }
                    } else if (tablePicker.columnCount > minColumnCount) {
                        // Remove.
                        const cellsToRemove = tablePicker.descendants(
                            descendant =>
                                descendant instanceof TableCellNode &&
                                descendant.columnIndex >= minColumnCount &&
                                descendant.columnIndex > tablePickerCell.columnIndex + 1,
                        );
                        for (const cellToRemove of cellsToRemove) {
                            toRedraw.add(cellToRemove.parent);
                            cellToRemove.remove();
                        }
                        if (cellsToRemove.length) toRedraw.add(tablePicker);
                    }
                });
            }
        };
        const onPickCell = async (ev: Event): Promise<void> => {
            const cell = ev.target as Element;
            await this.engine.editor.execCommand('insertTable', {
                rowCount: cell.getAttribute('data-rowCount'),
                columnCount: cell.getAttribute('data-columnCount'),
            });
        };

        domObject.attach = (el: HTMLTableCellElement): void => {
            el.addEventListener('mouseover', onMouseOver);
            el.addEventListener('mousedown', onPickCell);
        };
        domObject.detach = (el: HTMLTableCellElement): void => {
            el.removeEventListener('mouseover', onMouseOver);
            el.removeEventListener('mousedown', onPickCell);
        };
        return domObject;
    }
}
