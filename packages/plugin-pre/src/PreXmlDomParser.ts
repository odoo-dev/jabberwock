import { PreNode } from './PreNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class PreXmlDomParser extends AbstractParser<Node> {
    static id = 'dom/xml';
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'PRE';
    };

    async parse(item: Element): Promise<PreNode[]> {
        const pre = new PreNode();
        pre.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        // TODO: parse contained \n as LineBreaks.
        pre.append(...children);
        return [pre];
    }
}
