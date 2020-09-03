import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { OdooParallaxNode } from './OdooParallaxNode';

export class OdooParallaxSpanXmlDomParser extends AbstractParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.classList.contains('s_parallax_bg');
    };

    /**
     * @override
     */
    async parse(item: Element): Promise<VNode[]> {
        const odooStructure = new OdooParallaxNode();
        odooStructure.modifiers.append(this.engine.parseAttributes(item));
        return [odooStructure];
    }
}
