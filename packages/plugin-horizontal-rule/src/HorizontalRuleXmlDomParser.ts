import { HorizontalRuleNode } from './HorizontalRuleNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class HorizontalRuleXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'HR';
    };

    async parse(item: Element): Promise<HorizontalRuleNode[]> {
        const image = new HorizontalRuleNode();
        image.modifiers.append(this.engine.parseAttributes(item));
        return [image];
    }
}
