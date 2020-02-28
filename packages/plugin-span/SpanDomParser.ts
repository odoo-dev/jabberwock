import { FormatParser } from '../plugin-inline/FormatParser';
import { VNode } from '../core/src/VNodes/VNode';
import { SpanFormat } from './SpanFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class SpanDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (item.tagName === 'SPAN' || item.tagName === 'FONT');
    };

    /**
     * Parse a span node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const span = new SpanFormat(item.tagName as 'SPAN' | 'FONT');
        span.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(span, children);

        return children;
    }
}
