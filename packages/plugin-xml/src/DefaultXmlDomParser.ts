import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from './XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { nodeName } from '../../utils/src/utils';

export class DefaultXmlDomParser extends AbstractParser<Node> {
    static id = 'dom/xml';
    engine: XmlDomParsingEngine;

    async parse(item: Node): Promise<VNode[]> {
        // If the node could not be parsed, create a generic element node with
        // the HTML tag of the DOM Node. This way we may not support the node
        // but we don't break it either.
        const htmlTag = nodeName(item);
        const element = new TagNode({ htmlTag: htmlTag });

        if (item instanceof Element) {
            const attributes = this.engine.parseAttributes(item);
            if (attributes.length) {
                element.modifiers.append(attributes);
            }
        }
        const nodes = await this.engine.parse(...item.childNodes);
        element.append(...nodes);
        return [element];
    }
}
