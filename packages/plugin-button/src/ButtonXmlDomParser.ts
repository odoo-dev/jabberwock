import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { ButtonFormat } from './ButtonFormat';
import { nodeName } from '../../utils/src/utils';

export class ButtonXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'BUTTON';
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bold = new ButtonFormat();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            bold.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bold, children);

        return children;
    }
}
