import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';
import { DefaultXmlDomParser } from '../../plugin-xml/src/DefaultXmlDomParser';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class OdooXmlDomParsingEngine extends XmlDomParsingEngine {
    static readonly id: ParsingIdentifier = 'dom/xml';
    static readonly defaultParser = DefaultXmlDomParser;
    /**
     * Parse attributes and trasform odoo color classes to color style
     * so JW can treat them as normal colors
     *
     * @param node
     */
    parseAttributes(node: Element): Attributes {
        const attributes = super.parseAttributes(node);

        console.log('parse attribute ici');

        return attributes;
    }
}
