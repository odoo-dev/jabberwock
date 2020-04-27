import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { ItalicFormat } from './ItalicFormat';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class ItalicDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'I' || nodeName(item) === 'EM');
    };

    /**
     * Parse an italic node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const italic = new ItalicFormat(nodeName(item) as 'I' | 'EM');
        italic.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(italic, children);

        return children;
    }
}
