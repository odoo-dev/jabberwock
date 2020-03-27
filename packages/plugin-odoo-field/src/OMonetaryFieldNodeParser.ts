import { OdooFieldDomParser } from './OdooFieldDomParser';
import { OdooFieldNodeCurrencyPosition, OMonetaryFieldNode } from './OMonetaryFieldNode';
import { OdooFieldInfo } from './OdooField';

// todo: retrieve the current decimal of the current lang in odoo
const localDecimalSeparator = '.';

export class OdooMonetaryFieldDomParser extends OdooFieldDomParser {
    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.attributes['data-oe-type'] &&
            item.attributes['data-oe-model'] &&
            item.attributes['data-oe-type'].value === 'monetary'
        );
    };

    constructor(engine) {
        super(engine);
    }

    async _getNode(
        element: HTMLElement,
        odooReactiveField: OdooFieldInfo,
    ): Promise<OMonetaryFieldNode> {
        const amountElement = element.querySelector('.oe_currency_value');
        const childNodesToParse = amountElement.childNodes;

        const currency = (amountElement.previousSibling || amountElement.nextSibling).textContent;

        const fieldNode = new OMonetaryFieldNode({
            htmlTag: element.tagName,
            fieldInfo: odooReactiveField,
            currencyValue: currency,
            currencyPosition: amountElement.previousSibling
                ? OdooFieldNodeCurrencyPosition.BEFORE
                : OdooFieldNodeCurrencyPosition.AFTER,
        });
        const children = await this.engine.parse(...childNodesToParse);
        fieldNode.append(...children);
        return fieldNode;
    }

    /**
     * @override
     */
    _getValueFromParsing(element: HTMLElement): string {
        const amountElement = element.querySelector('.oe_currency_value');
        return amountElement.textContent;
    }

    /**
     * @override
     */
    _getValueFromRedering(element: HTMLElement): string {
        console.log('getFromElement', element);
        return this._getValueFromParsing(element);
    }
}
