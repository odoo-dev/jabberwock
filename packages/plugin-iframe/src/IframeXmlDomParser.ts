import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { IframeNode } from './IframeNode';
import { nodeName } from '../../utils/src/utils';

export class IframeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-IFRAME';
    };

    /**
     * Parse a shadow node and extract styling.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const shadow = new IframeNode();
        shadow.modifiers.append(this.engine.parseAttributes(item));
        const nodes = await this.engine.parse(...item.childNodes);
        shadow.append(...nodes);
        return [shadow];
    }
}
