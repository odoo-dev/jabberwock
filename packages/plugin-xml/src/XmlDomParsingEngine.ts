import { ParsingEngine, ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';
import { DefaultXmlDomParser } from './DefaultXmlDomParser';
import { Attributes } from './Attributes';

export class XmlDomParsingEngine<T extends Node = Node> extends ParsingEngine<T> {
    static readonly id: ParsingIdentifier = 'dom/xml';
    static readonly defaultParser = DefaultXmlDomParser;
    /**
     * Parse a node's attributes and return them.
     *
     * @param node
     */
    parseAttributes(node: Element): Attributes {
        const attributes = new Attributes();
        for (const attribute of Array.from(node.attributes)) {
            attributes.set(attribute.name, attribute.value);
        }
        return attributes;
    }
}
