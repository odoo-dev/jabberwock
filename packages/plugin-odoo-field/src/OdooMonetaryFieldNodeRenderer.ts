import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OdooMonetaryFieldNode, CurrencyPosition } from './OdooMonetaryFieldNode';
export class OdooMonetaryFieldDomRenderer extends OdooFieldDomRenderer {
    predicate = OdooMonetaryFieldNode;

    async _renderValue(node: OdooMonetaryFieldNode, container: HTMLElement): Promise<void> {
        const valueContainer = document.createElement('span');
        valueContainer.classList.add('oe_currency_value');
        container.appendChild(valueContainer);
        const currency = document.createTextNode(node.fieldInfo.currencyValue);
        if (node.fieldInfo.currencyPosition === CurrencyPosition.BEFORE) {
            container.prepend(currency);
        } else {
            container.append(currency);
        }
        await super._renderValue(node, valueContainer);
    }
}
