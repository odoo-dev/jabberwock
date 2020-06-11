import { FontAwesomeNode } from './FontAwesomeNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export const FontAwesomeRegex = /(^|[\s*\n*])fa[bdlrs]?[\s*\n*$]/;

export class FontAwesomeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return FontAwesomeXmlDomParser.isFontAwesome(item);
    };

    async parse(item: Element): Promise<FontAwesomeNode[]> {
        const fontawesome = new FontAwesomeNode({ htmlTag: nodeName(item) });
        fontawesome.modifiers.append(this.engine.parseAttributes(item));
        return [fontawesome];
    }

    /**
     * Return true if the given DOM node is a fontawesome.
     *
     * @param item
     */
    static isFontAwesome(item: Node): item is Element {
        return item instanceof Element && FontAwesomeRegex.test(item.className);
    }
}
