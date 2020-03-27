import { FontAwesomeNode } from './FontAwesomeNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';

export const FontAwesomeRegex = /(^|[\s*\n*])fa[bdlrs]?[\s*\n*$]/;

export class FontAwesomeDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return FontAwesomeDomParser.isFontAwesome(item);
    };

    async parse(item: Element): Promise<FontAwesomeNode[]> {
        const fontawesome = new FontAwesomeNode(item.nodeName);
        fontawesome.attributes = this.engine.parseAttributes(item);
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
