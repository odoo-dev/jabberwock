import { FormatParser } from '../plugin-inline/FormatParser';
import { VNode } from '../core/src/VNodes/VNode';
import { SubscriptFormat } from './SubscriptFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class SubscriptDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.nodeName === 'SUB';
    };

    /**
     * Parse a span node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const subscript = new SubscriptFormat();
        subscript.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(subscript, children);

        return children;
    }
}
