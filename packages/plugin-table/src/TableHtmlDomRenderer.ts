import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { TableNode } from './TableNode';
import { TableRowNode } from './TableRowNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { nodeName } from '../../utils/src/utils';

export class TableHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = TableNode;

    /**
     * Render the TableNode along with its contents (TableRowNodes).
     */
    async render(table: TableNode): Promise<Node[]> {
        const domTable = document.createElement('table');
        const domHead = document.createElement('thead');
        let domBody = document.createElement('tbody');

        for (const child of table.children()) {
            const domChild = await this.renderChild(child);
            if (child.is(TableRowNode)) {
                // If the child is a row, append it to its containing section.
                const tableSection = child.header ? domHead : domBody;
                tableSection.append(...domChild);
                const sectionAttributes = child.attributes['table-section-attributes'];
                if (sectionAttributes) {
                    this.engine.renderAttributes(
                        sectionAttributes as Record<string, string>,
                        tableSection,
                    );
                }
                if (!tableSection.parentNode) {
                    domTable.append(tableSection);
                }
            } else {
                domTable.append(...domChild);
                // Create a new <tbody> so the rest of the rows, if any, get
                // appended to it, after this element.
                domBody = document.createElement('tbody');
            }
        }
        this.engine.renderAttributes(table.attributes, domTable);
        return [domTable];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given item is a table section element.
     *
     * @param item
     */
    _isTableSection(item: Node): item is HTMLTableSectionElement {
        const name = nodeName(item);
        return name === 'THEAD' || name === 'TBODY';
    }
}
