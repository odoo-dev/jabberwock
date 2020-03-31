import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { ShadowNode } from './ShadowNode';
import { nodeName } from '../../utils/src/utils';
import { HtmlNode } from '../../plugin-html/src/HtmlDomParsingEngine';

export class ShadowXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'JW-SHADOW';
    };

    /**
     * Parse a shadow node and extract styling.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const shadow = new ShadowNode();
        const childNodes = Array.from(item.childNodes) as HtmlNode[];
        const nodes = await this.engine.parse(...childNodes);
        shadow.append(...nodes);
        return [shadow];
    }
}
