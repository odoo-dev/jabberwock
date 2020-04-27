import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { TableRowNode } from './TableRowNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class TableRowHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = TableRowNode;

    /**
     * Render the TableRowNode along with its contents.
     */
    async render(row: TableRowNode): Promise<Node[]> {
        const domRow = document.createElement('tr');
        this.engine.renderAttributes(row.attributes, domRow);
        const renderedChildren = await this.renderChildren(row);
        for (const renderedChild of renderedChildren) {
            for (const domChild of renderedChild) {
                domRow.appendChild(domChild);
            }
        }
        return [domRow];
    }
}
