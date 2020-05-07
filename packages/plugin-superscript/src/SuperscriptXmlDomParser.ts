import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { SuperscriptFormat } from './SuperscriptFormat';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class SuperscriptXmlDomParser extends FormatParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'SUP';
    };

    /**
     * Parse a span node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const superscript = new SuperscriptFormat();
        superscript.modifiers.append(this.engine.parseAttributes(item));
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(superscript, children);

        return children;
    }
}
