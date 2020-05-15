import { FormatParser } from '../../plugin-inline/src/FormatParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { LinkFormat } from './LinkFormat';
import { nodeName } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class LinkXmlDomParser extends FormatParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'A';
    };

    async parse(item: Element): Promise<VNode[]> {
        const link = new LinkFormat(item.getAttribute('href'));
        link.modifiers.append(this.engine.parseAttributes(item));
        link.modifiers.find(Attributes)?.remove('href'); // href is on link.url
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(link, children);

        return children;
    }
}
