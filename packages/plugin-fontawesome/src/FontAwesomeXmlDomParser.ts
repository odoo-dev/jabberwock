import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { VersionableArray } from '../../core/src/Memory/VersionableArray';
import { FontAwesomeNode } from './FontAwesomeNode';

export const FontAwesomeRegex = /(?:^|\s|\n)(fa[bdlrs]?)(?:.|\n)*?(fa-.*?)(?:\s|\n|$)/;

export class FontAwesomeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && FontAwesomeRegex.test(item.className);
    };

    async parse(item: Element): Promise<FontAwesomeNode[]> {
        const attributes = this.engine.parseAttributes(item);
        // Remove fa classes to avoid having them spread to nearby nodes.
        // They will be put back at renderng time.
        const faClasses = item.className.match(FontAwesomeRegex).slice(1);
        const icon = new FontAwesomeNode({
            htmlTag: nodeName(item),
            iconClasses: new VersionableArray(...faClasses),
        });
        attributes.classList.remove(...faClasses);
        // Keep the attributes even though it might be empty as it will be used
        // to restore the proper order of classes.
        icon.modifiers.append(attributes);
        return [icon];
    }
}
