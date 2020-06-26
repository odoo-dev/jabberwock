import { FontAwesomeNode } from './FontAwesomeNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { VersionableArray } from '../../core/src/Memory/VersionableArray';

export const FontAwesomeRegex = /(?:^|\s|\n)(fa(?:([bdlrs]?)|(-.*?)))/;

export class FontAwesomeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return FontAwesomeXmlDomParser.isFontAwesome(item);
    };

    async parse(item: Element): Promise<FontAwesomeNode[]> {
        const attributes = this.engine.parseAttributes(item);
        // Remove fa classes to avoid having them spread to nearby nodes.
        // They will be put back at renderng time.
        const faClasses: string[] = [];
        for (const className of attributes.classList.items()) {
            if (FontAwesomeRegex.test(className)) {
                faClasses.push(className);
            }
        }
        const fontawesome = new FontAwesomeNode({
            htmlTag: nodeName(item),
            faClasses: new VersionableArray(...faClasses),
        });
        attributes.classList.remove(...faClasses);
        // Keep the attributes even though it might be empty as it will be used
        // to restore the proper order of classes.
        fontawesome.modifiers.append(attributes);
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
