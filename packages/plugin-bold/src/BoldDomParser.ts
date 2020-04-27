import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { BoldFormat } from './BoldFormat';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class BoldDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'B' || nodeName(item) === 'STRONG');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bold = new BoldFormat(nodeName(item) as 'B' | 'STRONG');
        bold.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bold, children);

        return children;
    }
}
