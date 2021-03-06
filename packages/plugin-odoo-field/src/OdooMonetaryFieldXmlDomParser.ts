import { OdooFieldXmlDomParser } from './OdooFieldXmlDomParser';
import { OdooMonetaryFieldNode, CurrencyPosition } from './OdooMonetaryFieldNode';
import { OdooFieldInfo } from './OdooField';

// TODO: retrieve the current decimal of the current lang in odoo
// const localDecimalSeparator = '.';

export class OdooMonetaryFieldXmlDomParser extends OdooFieldXmlDomParser {
    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.attributes['data-oe-type'] &&
            item.attributes['data-oe-model'] &&
            item.attributes['data-oe-type'].value === 'monetary'
        );
    };

    async _parseField(element: Element, fieldInfo: OdooFieldInfo): Promise<OdooMonetaryFieldNode> {
        const amountElement = element.querySelector('.oe_currency_value');
        const currencyElement = amountElement.previousSibling || amountElement.nextSibling;

        const fieldNode = new OdooMonetaryFieldNode({
            htmlTag: element.tagName,
            fieldInfo: {
                ...fieldInfo,
                currencyValue: currencyElement.textContent,
                currencyPosition: amountElement.previousSibling
                    ? CurrencyPosition.BEFORE
                    : CurrencyPosition.AFTER,
            },
        });

        const childNodesToParse = amountElement.childNodes;
        const children = await this.engine.parse(...childNodesToParse);
        fieldNode.append(...children);

        return fieldNode;
    }

    /**
     * @override
     */
    _parseValue(source: Element): string;
    _parseValue(source: OdooMonetaryFieldNode): string;
    _parseValue(source: Element | OdooMonetaryFieldNode): string {
        if (source instanceof Element) {
            const amountElement = source.querySelector('.oe_currency_value');
            return amountElement.textContent;
        } else {
            return super._parseValue(source);
        }
    }
}
