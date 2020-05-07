import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { InputNode } from './InputNode';
import { nodeName } from '../../utils/src/utils';

export class InputXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'INPUT';
    };

    async parse(item: HTMLInputElement): Promise<InputNode[]> {
        const input = new InputNode();
        input.modifiers.append(this.engine.parseAttributes(item));
        input.value = item.value;
        const nodes = await this.engine.parse(...item.childNodes);
        input.append(...nodes);
        return [input];
    }
}
