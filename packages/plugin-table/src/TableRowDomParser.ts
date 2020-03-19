import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { TableRowNode } from './TableRowNode';
import { nodeName } from '../../utils/src/utils';

export class TableRowDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): item is Element => {
        return nodeName(item) === 'THEAD' || nodeName(item) === 'TBODY' || nodeName(item) === 'TR';
    };

    /**
     * Parse a row node or a table section node.
     *
     * @param item
     */
    async parse(item: Element): Promise<TableRowNode[]> {
        if (this._isTableSection(item)) {
            return this.parseTableSection(item);
        } else if (nodeName(item) === 'TR') {
            const row = new TableRowNode();
            row.attributes = this.engine.parseAttributes(item);
            const cells = await this.engine.parse(...item.childNodes);
            row.append(...cells);
            return [row];
        }
    }
    /**
     * Parse a <tbody> or a <thead> into an array of table rows with their
     * `header` property set in function of whether they are contained in a
     * <tbody> or a <thead>.
     *
     * @param tableSection
     */
    async parseTableSection(tableSection: HTMLTableSectionElement): Promise<TableRowNode[]> {
        const parsedNodes = [];

        // Parse the section's children.
        for (const child of tableSection.childNodes) {
            parsedNodes.push(...(await this.engine.parse(child)));
        }

        // Parse the <tbody> or <thead>'s attributes into a technical key of the
        // node's attributes, that will be read only by `TableRowDomRenderer`.
        const containerAttributes = this.engine.parseAttributes(tableSection);

        // Apply the attributes and `header` property of the container to each
        // row.
        for (const parsedNode of parsedNodes) {
            if (parsedNode.is(TableRowNode)) {
                parsedNode.header = nodeName(tableSection) === 'THEAD';
                parsedNode.attributes['table-section-attributes'] = containerAttributes;
            }
        }
        return parsedNodes;
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
        return nodeName(item) === 'THEAD' || nodeName(item) === 'TBODY';
    }
}
