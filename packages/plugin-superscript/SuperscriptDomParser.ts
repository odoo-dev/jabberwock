import { FormatParser } from '../plugin-inline/FormatParser';
import { VNode } from '../core/src/VNodes/VNode';
import { SuperscriptFormat } from './SuperscriptFormat';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class SuperscriptDomParser extends FormatParser {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.nodeName === 'SUP';
    };

    /**
     * Parse a span node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const subscript = new SuperscriptFormat();
        subscript.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(subscript, children);

        return children;
    }
}
