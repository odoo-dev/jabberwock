import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { UnderlineFormat } from './UnderlineFormat';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';

export class UnderlineDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'U';
    };

    /**
     * Parse an underline node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const underline = new UnderlineFormat();
        underline.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(underline, children);

        return children;
    }
}