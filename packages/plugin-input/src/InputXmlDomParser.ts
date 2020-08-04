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
            inputType: item.getAttribute('type'),
            inputName: item.getAttribute('name'),
            value: item.value,
        });
        input.modifiers.append(this.engine.parseAttributes(item));
        const attributes = input.modifiers.find(Attributes);
        if (attributes) {
            attributes.remove('type'); // type is on input.inputType
            attributes.remove('name'); // type is on input.inputName
        }
        const nodes = await this.engine.parse(...item.childNodes);
        input.append(...nodes);
        return [input];
    }
}
