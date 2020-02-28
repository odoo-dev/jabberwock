import { FormatParser } from '../plugin-inline/FormatParser';
import { VNode } from '../core/src/VNodes/VNode';
import { ItalicFormat } from './ItalicFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class ItalicDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (item.tagName === 'I' || item.tagName === 'EM');
    };

    /**
     * Parse an italic node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const italic = new ItalicFormat(item.tagName as 'I' | 'EM');
        italic.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(italic, children);

        return children;
    }
}
