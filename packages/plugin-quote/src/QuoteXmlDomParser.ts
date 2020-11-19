import { VNode } from '../../core/src/VNodes/VNode';
import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { nodeName } from '../../utils/src/utils';
import { QuoteFormat } from './QuoteFormat';

export class QuoteXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'Q';
    };

    /**
     * Parse an italic node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const quote = new QuoteFormat();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            quote.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(quote, children);

        return children;
    }
}
