import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { OdooStructureNode } from './OdooStructureNode';
import { nodeName } from '../../utils/src/utils';

export class OdooStructureXmlDomParser extends AbstractParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.classList.contains('oe_structure') &&
            item.attributes &&
            item.attributes['data-oe-xpath'] &&
            item.attributes['data-oe-id']
        );
    };

    /**
     * Parse a structure node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const odooStructure = new OdooStructureNode({
            htmlTag: nodeName(item),
            xpath: item.attributes['data-oe-xpath'].value,
            viewId: item.attributes['data-oe-id'].value,
        });
        odooStructure.modifiers.append(this.engine.parseAttributes(item));
        const children = await this.engine.parse(...item.childNodes);
        odooStructure.append(...children);

        odooStructure.on('childList', () => {
            odooStructure.dirty = true;
        });
        return [odooStructure];
    }
}
