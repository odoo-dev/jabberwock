import { OdooFieldDomObjectRenderer } from './OdooFieldDomObjectRenderer';
import { OdooMonetaryFieldNode, CurrencyPosition } from './OdooMonetaryFieldNode';
import {
    DomObjectElement,
    DomObjectText,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class OdooMonetaryFieldDomObjectRenderer extends OdooFieldDomObjectRenderer {
    predicate = OdooMonetaryFieldNode;

    async _renderValue(node: OdooMonetaryFieldNode, container: DomObjectElement): Promise<void> {
        const valueContainer: DomObjectElement = {
            tag: 'span',
            attributes: {
                class: new Set(['oe_currency_value']),
            },
        };

        // TODO CHM: not having default values is cumbersome
        const children = container.children || [];

        children.push(valueContainer);

        const currency: DomObjectText = { text: node.fieldInfo.currencyValue };
        if (node.fieldInfo.currencyPosition === CurrencyPosition.BEFORE) {
            children.unshift(currency);
        } else {
            children.push(currency);
        }

        container.children = children;

        await super._renderValue(node, valueContainer);
    }
}
