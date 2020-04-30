import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { DividerNode } from './DividerNode';
import { nodeName } from '../../utils/src/utils';

export class DividerXmlDomParser extends AbstractParser<Node> {
    static id = 'dom/xml';
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'DIV';
    };

    async parse(item: Element): Promise<DividerNode[]> {
        const divider = new DividerNode();
        divider.attributes = this.engine.parseAttributes(item);
        const nodes = await this.engine.parse(...item.childNodes);
        divider.append(...nodes);
        return [divider];
    }
}
