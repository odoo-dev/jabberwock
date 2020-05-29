import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OMonetaryFieldNode, OdooFieldNodeCurrencyPosition } from './OMonetaryFieldNode';
export class OdooMonetaryFieldDomRenderer extends OdooFieldDomRenderer {
    predicate = OMonetaryFieldNode;

    _getContent(container: HTMLElement, node: OMonetaryFieldNode): HTMLElement {
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
