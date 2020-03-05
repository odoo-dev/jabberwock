import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { TableCellNode } from './TableCellNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class TableCellDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = TableCellNode;

    /**
     * Render the TableCellNode along with its contents.
     *
     * @param cell
     */
    async render(cell: TableCellNode): Promise<Node[]> {
        // If the cell is not active, do not render it (it means it is
        // represented by its manager cell's colspan or rowspan: it was merged).
        if (!cell.isActive()) return [];

        // Render the cell and its contents.
        const td = document.createElement(cell.header ? 'th' : 'td');
        const renderedChildren = await this.renderChildren(cell);
        for (const renderedChild of renderedChildren) {
            for (const domChild of renderedChild) {
                td.append(domChild);
            }
        }

        // Render attributes.
        // Colspan and rowspan are handled differently from other attributes:
        // they are automatically calculated in function of the cell's managed
        // cells. Render them here. If their value is 1 or less, they are
        // insignificant so no need to render them.
        const attributes = { ...cell.attributes };
        if (cell.colspan > 1) {
            attributes.colspan = '' + cell.colspan;
        }
        if (cell.rowspan > 1) {
            attributes.rowspan = '' + cell.rowspan;
        }
        this.engine.renderAttributes(attributes, td);

        return [td];
    }
}
