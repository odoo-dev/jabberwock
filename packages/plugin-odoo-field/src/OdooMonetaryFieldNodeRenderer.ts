import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OdooMonetaryFieldNode, OdooFieldNodeCurrencyPosition } from './OdooMonetaryFieldNode';
export class OdooMonetaryFieldDomRenderer extends OdooFieldDomRenderer {
    predicate = OdooMonetaryFieldNode;

    _getContent(container: HTMLElement, node: OdooMonetaryFieldNode): HTMLElement {
        const fieldContainer = document.createElement('span');
        fieldContainer.classList.add('oe_currency_value');
        container.appendChild(fieldContainer);
        const currency = document.createTextNode(node.currencyValue);
        if (node.currencyPosition === OdooFieldNodeCurrencyPosition.BEFORE) {
            container.prepend(currency);
        } else {
            container.append(currency);
        }
        return fieldContainer;
    }
}
