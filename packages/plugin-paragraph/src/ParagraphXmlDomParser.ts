import { ParagraphNode } from './ParagraphNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class ParagraphXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'P';
    };

    async parse(item: Element): Promise<ParagraphNode[]> {
        const paragraph = new ParagraphNode();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            paragraph.modifiers.append(attributes);
        }
        const nodes = await this.engine.parse(...item.childNodes);
        paragraph.append(...nodes);
        return [paragraph];
    }
}
