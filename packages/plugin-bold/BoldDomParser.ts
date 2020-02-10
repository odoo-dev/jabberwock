import { FormatDomParser } from '../plugin-inline/FormatDomParser';
import { VNode } from '../core/src/VNodes/VNode';
import { BoldFormat } from './BoldFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class BoldDomParser extends FormatDomParser {
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (item.nodeName === 'B' || item.nodeName === 'STRONG');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bold = new BoldFormat(item.nodeName as 'B' | 'STRONG');
        bold.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bold, children);

        return children;
    }
}
