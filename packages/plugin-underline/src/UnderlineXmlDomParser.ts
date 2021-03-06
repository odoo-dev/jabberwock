import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { UnderlineFormat } from './UnderlineFormat';
import { nodeName } from '../../utils/src/utils';

export class UnderlineXmlDomParser extends FormatXmlDomParser {
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
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            underline.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(underline, children);

        return children;
    }
}
