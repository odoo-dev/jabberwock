import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { OdooFieldNodeCurrency, OdooFieldNodeCurrencyPosition } from './OdooFieldNodeCurrency';

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = (node): boolean => node instanceof OdooFieldNode;

    async render(node: OdooFieldNode | OdooFieldNodeCurrency): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);
        let fieldContainer = container;

        // Special case 4/4 for monetary field.
        if (node instanceof OdooFieldNodeCurrency) {
            fieldContainer = document.createElement('span');
            fieldContainer.classList.add('oe_currency_value');
            container.appendChild(fieldContainer);
            const currency = document.createTextNode(node.options.currencyValue);
            if (node.options.currencyPosition === OdooFieldNodeCurrencyPosition.BEFORE) {
                container.prepend(currency);
            } else {
                container.append(currency);
            }
        }
        this.engine.renderAttributes(node.attributes, container);
        const selectionAncestor = this.engine.editor.selection.range.start.ancestor(
            ancestor =>
                ancestor.is(OdooFieldNode) && ancestor.fieldInfo.value === node.fieldInfo.value,
        );
        if (selectionAncestor) {
            fieldContainer.classList.add('jw-focus');
        }
        fieldContainer.classList.add('jw-odoo-field');

        if (!node.fieldInfo.isValid.get()) {
            fieldContainer.classList.add('jw-odoo-field-invalid');
        }

        const renderedChildren = await this.renderChildren(node);
        for (const renderedChild of renderedChildren) {
            for (const domChild of renderedChild) {
                fieldContainer.append(domChild);
            }
        }

        return [container];
    }
}
