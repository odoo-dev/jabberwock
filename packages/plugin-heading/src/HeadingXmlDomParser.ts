import { HeadingNode } from './HeadingNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

const HeadingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export class HeadingXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && HeadingTags.includes(nodeName(item));
    };

    async parse(item: Element): Promise<HeadingNode[]> {
        const heading = new HeadingNode({ level: parseInt(nodeName(item)[1], 10) });
        heading.modifiers.append(this.engine.parseAttributes(item));
        const nodes = await this.engine.parse(...item.childNodes);
        heading.append(...nodes);
        return [heading];
    }
}
