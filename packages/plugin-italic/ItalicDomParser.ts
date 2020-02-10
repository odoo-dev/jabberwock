import { FormatDomParser } from '../plugin-inline/FormatDomParser';
import { VNode } from '../core/src/VNodes/VNode';
import { ItalicFormat } from './ItalicFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class ItalicDomParser extends FormatDomParser {
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (item.nodeName === 'I' || item.nodeName === 'EM');
    };

    /**
     * Parse an italic node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const italic = new ItalicFormat(item.nodeName as 'I' | 'EM');
        italic.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(italic, children);

        return children;
    }
}
