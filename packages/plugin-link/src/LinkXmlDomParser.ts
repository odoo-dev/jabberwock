import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { LinkFormat } from './LinkFormat';
import { nodeName } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class LinkXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'A';
    };

    async parse(item: Element): Promise<VNode[]> {
        const link = new LinkFormat(item.getAttribute('href'));
        // TODO: Link should not have an `Attributes` modifier outside of XML.
        // In XML context we need to conserve the order of attributes.
        link.modifiers.replace(Attributes, this.engine.parseAttributes(item));
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(link, children);

        return children;
    }
}
