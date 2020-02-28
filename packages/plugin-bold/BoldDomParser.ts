import { FormatParser } from '../plugin-inline/FormatParser';
import { VNode } from '../core/src/VNodes/VNode';
import { BoldFormat } from './BoldFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class BoldDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (item.tagName === 'B' || item.tagName === 'STRONG');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bold = new BoldFormat(item.tagName as 'B' | 'STRONG');
        bold.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bold, children);

        return children;
    }
}
