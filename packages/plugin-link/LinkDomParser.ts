import { FormatParser } from '../plugin-inline/FormatParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';
import { VNode } from '../core/src/VNodes/VNode';
import { LinkFormat } from './LinkFormat';

export class LinkDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'A';
    };

    async parse(item: Element): Promise<VNode[]> {
        const link = new LinkFormat();
        link.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(link, children);

        return children;
    }
}
