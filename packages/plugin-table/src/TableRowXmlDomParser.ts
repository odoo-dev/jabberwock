import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { TableRowNode } from './TableRowNode';
import { nodeName } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Modifiers } from '../../core/src/Modifiers';

export class TableSectionAttributes extends Attributes {}

export class TableRowXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): item is Element => {
        const name = nodeName(item);
        return name === 'THEAD' || name === 'TBODY' || name === 'TR';
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
            const attributes = this.engine.parseAttributes(item);
            if (attributes.length) {
                row.modifiers.append(attributes);
            }
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

        // Parse the <tbody> or <thead>'s modifiers.
        const attributes = this.engine.parseAttributes(tableSection);

        // Apply the attributes, style and `header` property of the container to
        // each row.
        const name = nodeName(tableSection);
        for (const parsedNode of parsedNodes) {
            if (parsedNode instanceof TableRowNode) {
                parsedNode.header = name === 'THEAD';
                parsedNode.modifiers.replace(
                    TableSectionAttributes,
                    new TableSectionAttributes(attributes),
                );
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
        const name = nodeName(item);
        return name === 'THEAD' || name === 'TBODY';
    }
}
