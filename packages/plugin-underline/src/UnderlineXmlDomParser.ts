import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { UnderlineFormat } from './UnderlineFormat';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class UnderlineXmlDomParser extends FormatParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'U';
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
