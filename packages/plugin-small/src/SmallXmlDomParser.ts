import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { SmallFormat } from './SmallFormat';
import { nodeName } from '../../utils/src/utils';

export class SmallXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'SMALL';
    };

    /**
     * Parse a small node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const small = new SmallFormat();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            small.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(small, children);

        return children;
    }
}
