import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { ThemeNode } from './ThemeNode';
import { nodeName } from '../../utils/src/utils';

export class ThemeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-THEME';
    };

    /**
     * Parse a shadow node and extract styling.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const theme = new ThemeNode({ theme: item.getAttribute('name') });
        const attributes = this.engine.parseAttributes(item);
        attributes.remove('name');
        if (attributes.length) {
            theme.modifiers.append(attributes);
        }
        const nodes = await this.engine.parse(...item.childNodes);
        theme.append(...nodes);
        return [theme];
    }
}
