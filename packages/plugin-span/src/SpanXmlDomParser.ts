import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { SpanFormat } from './SpanFormat';
import { nodeName } from '../../utils/src/utils';
import { InlineNode } from '../../plugin-inline/src/InlineNode';

export class SpanXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'SPAN' || nodeName(item) === 'FONT');
    };

    /**
     * Parse a span node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const span = new SpanFormat(nodeName(item) as 'SPAN' | 'FONT');
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            span.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        // Handle empty spans.
        if (!children.length) {
            children.push(new InlineNode());
        }
        this.applyFormat(span, children);

        return children;
    }
}
