import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { InputNode } from './InputNode';
import { nodeName } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class InputXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'INPUT';
    };

    async parse(item: HTMLInputElement): Promise<InputNode[]> {
        const input = new InputNode({
            type: item.getAttribute('type'),
            name: item.getAttribute('name'),
            value: item.value,
        });
        const attributes = this.engine.parseAttributes(item);
        if (attributes) {
            attributes.remove('type'); // type is on input.inputType
            attributes.remove('name'); // type is on input.inputName
        }
        if (attributes.length) {
            input.modifiers.append(attributes);
        }
        const nodes = await this.engine.parse(...item.childNodes);
        input.append(...nodes);
        return [input];
    }
}
