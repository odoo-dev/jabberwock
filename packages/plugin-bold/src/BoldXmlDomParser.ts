import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { BoldFormat } from './BoldFormat';
import { nodeName } from '../../utils/src/utils';

export class BoldXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'B' || nodeName(item) === 'STRONG');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bold = new BoldFormat(nodeName(item) as 'B' | 'STRONG');
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            bold.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bold, children);

        return children;
    }
}
