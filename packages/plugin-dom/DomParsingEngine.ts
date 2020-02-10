import { ParsingEngine } from '../core/src/ParsingEngine';
import { DefaultDomParser } from './DefaultDomParser';

export class DomParsingEngine extends ParsingEngine<Node> {
    static readonly id = 'dom';
    static readonly defaultParser = DefaultDomParser;
    /**
     * Parse a node's attributes and return them.
     *
     * @param node
     */
    parseAttributes(node: Element): Record<string, string> {
        return Array.from(node.attributes).reduce((attributes, attribute) => {
            attributes[attribute.name] = attribute.value;
            return attributes;
        }, {});
    }
}
