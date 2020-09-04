import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { StrikethroughFormat } from './StrikethroughFormat';
import { nodeName } from '../../utils/src/utils';

export class StrikethroughXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'S' || nodeName(item) === 'DEL');
    };

    /**
     * Parse a strikethrough node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const strikethrough = new StrikethroughFormat(nodeName(item) as 'S' | 'DEL');
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            strikethrough.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(strikethrough, children);

        return children;
    }
}
