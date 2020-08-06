import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { ItalicFormat } from './ItalicFormat';
import { nodeName } from '../../utils/src/utils';

export class ItalicXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && (nodeName(item) === 'I' || nodeName(item) === 'EM');
    };

    /**
     * Parse an italic node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const italic = new ItalicFormat(nodeName(item) as 'I' | 'EM');
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            italic.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(italic, children);

        return children;
    }
}
