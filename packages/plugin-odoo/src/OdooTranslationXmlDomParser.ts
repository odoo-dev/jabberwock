import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { OdooTranslationFormat } from './OdooTranslationFormat';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { nodeName } from '../../utils/src/utils';

const selector =
    '[data-oe-translation-id], ' +
    '[data-oe-model][data-oe-id][data-oe-field], ' +
    '[placeholder*="data-oe-translation-id="], ' +
    '[title*="data-oe-translation-id="], ' +
    '[alt*="data-oe-translation-id="]';

export class OdooTranslationXmlDomParser extends FormatXmlDomParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.attributes['data-oe-translation-state'] &&
            !item.querySelector(selector)
        );
    };
    /**
     * Parse a translation node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        OdooTranslationFormat.addInitialValue(item);
        const odooTranslation = new OdooTranslationFormat(
            nodeName(item),
            item.getAttribute('data-oe-translation-id'),
        );
        odooTranslation.modifiers.replace(Attributes, this.engine.parseAttributes(item));
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(odooTranslation, children);

        return children;
    }
}
