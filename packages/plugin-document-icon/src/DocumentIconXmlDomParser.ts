import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { DocumentIconNode } from './DocumentIconNode';
import { VersionableArray } from '../../core/src/Memory/VersionableArray';

export class DocumentIconXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean =>
        item instanceof Element && nodeName(item) === 'A' && item.classList.contains('o_image');

    async parse(item: Element): Promise<DocumentIconNode[]> {
        const attributes = this.engine.parseAttributes(item);
        const icon = new DocumentIconNode({
            htmlTag: 'A',
            iconClasses: new VersionableArray('o_image'),
            iconLink: item.getAttribute('href'),
        });
        attributes.classList.remove('o_image');
        attributes.remove('href');
        icon.modifiers.append(attributes);
        return [icon];
    }
}
