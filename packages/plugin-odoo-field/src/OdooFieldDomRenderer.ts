import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import {
    OdooFieldNodeCurrency,
    isOdooFieldNodeCurrency,
    OdooFieldNodeCurrencyPosition,
} from './OdooFieldNodeCurrency';

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = (node): boolean =>
        node instanceof OdooFieldNode || node instanceof OdooFieldNodeCurrency;

    async render(node: OdooFieldNode | OdooFieldNodeCurrency): Promise<Node[]> {
        const container = document.createElement(node.originalTagName);
        let fieldContainer = container;

        // Special case 4/4 for monetary field.
        if (isOdooFieldNodeCurrency(node)) {
            fieldContainer = document.createElement('span');
            fieldContainer.classList.add('oe_currency_value');
            container.appendChild(fieldContainer);
            const currencyNode = document.createTextNode(node.currency);
            if (node.currencyPosition === OdooFieldNodeCurrencyPosition.BEFORE) {
                container.prepend(currencyNode);
            } else {
                container.appendChild(currencyNode);
            }
        }
        this.engine.renderAttributes(node.attributes, container);

        const selectionAncestors = this.engine.editor.selection.range.start.ancestors();
        if (
            selectionAncestors.find(
                ancestorNode =>
                    ancestorNode instanceof OdooFieldNode && ancestorNode.value === node.value,
            )
        ) {
            fieldContainer.classList.add('jw-focus');
        }
        fieldContainer.classList.add('jw-odoo-field');

        const setValid = (): void => {
            if (!node.isValid.get()) {
                fieldContainer.classList.add('jw-odoo-field-invalid');
            } else {
                fieldContainer.classList.remove('jw-odoo-field-invalid');
            }
        };
        node.isValid.on('set', setValid);
        setValid();

        const renderedChildren = await this.renderChildren(node);
        for (const renderedChild of renderedChildren) {
            for (const domChild of renderedChild) {
                fieldContainer.append(domChild);
            }
        }

        return [container];
    }
}
