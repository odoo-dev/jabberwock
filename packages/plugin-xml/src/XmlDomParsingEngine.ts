import { ParsingEngine, ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';
import { DefaultXmlDomParser } from './DefaultXmlDomParser';

export class XmlDomParsingEngine<T extends Node = Node> extends ParsingEngine<T> {
    static readonly id: ParsingIdentifier = 'dom/xml';
    static readonly defaultParser = DefaultXmlDomParser;
    /**
     * Parse a node's attributes and return them.
     *
     * @param node
     */
    parseAttributes(node: Element): Record<string, string> {
        return Array.from(node.attributes || []).reduce((attributes, attribute) => {
            attributes[attribute.name] = attribute.value;
            return attributes;
        }, {});
    }
}
