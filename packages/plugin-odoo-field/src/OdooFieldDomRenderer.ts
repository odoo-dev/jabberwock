import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { OMonetaryFieldNode, OdooFieldNodeCurrencyPosition } from './OMonetaryFieldNode';
import { ONumberFieldNode } from './ONumberFieldNode';
import { OFloatFieldNode } from './OFloatFieldNode';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = (node): boolean => node instanceof OdooFieldNode;
    focusedNode: ReactiveValue<OdooFieldNode | undefined> = new ReactiveValue(undefined);

    async render(node: OdooFieldNode | OMonetaryFieldNode): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);

        this.engine.renderAttributes(node.attributes, container);
        const input = document.createElement('input');
        input.classList.add('jw-odoo-field');

        // todo: get the decimal separator from odoo;
        const decimalSeparator = '.';

        const value = node.fieldInfo.value.get();
        if (node instanceof ONumberFieldNode) {
            const parsedValue = parseInt(value.replace(/\D/g, ''));
            input.setAttribute('type', 'number');
            input.setAttribute('value', parsedValue);
        } else if (node instanceof OFloatFieldNode) {
            const splitedValue = value.split(decimalSeparator);
            const beforeDecimal = parseInt(splitedValue[0].replace(/\D/g, ''));
            const afterDecimal = splitedValue[1];
            const inputValue = afterDecimal ? beforeDecimal + '.' + afterDecimal : beforeDecimal;

            input.setAttribute('type', 'number');
            input.setAttribute('step', `0.01`);
            input.setAttribute('value', inputValue);
        } else {
            input.setAttribute('type', 'text');
            input.setAttribute('value', node.fieldInfo.value.get());
        }

        if (node.fieldInfo.value === this.focusedNode) {
            input.classList.add('jw-focus');
        }
        const focusHander = () => {
            const focusedNode = this.focusedNode.get();
            if (focusedNode && focusedNode.fieldInfo.value === node.fieldInfo.value) {
                input.classList.add('jw-focus');
            } else {
                input.classList.remove('jw-focus');
                true;
            }
        };
        this.focusedNode.on('set', focusHander);
        focusHander();

        const textHandler = event => {
            node.fieldInfo.value.set(input.value);
        };
        const clickHandler = (event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        const focusHandler = event => {
            this.focusedNode.set(node);
        };
        const blurHandler = event => {
            console.log('blur');
            this.focusedNode.set(undefined);
        };

        node.fieldInfo.value.on('set', () => {
            input.value = node.fieldInfo.value.get();
        });
        input.addEventListener('click', clickHandler);
        input.addEventListener('input', textHandler);
        input.addEventListener('focus', focusHandler);
        input.addEventListener('blur', blurHandler);

        this._destroyCallbacks.push(() => {
            input.removeEventListener('input', textHandler);
            input.removeEventListener('focus', focusHandler);
            input.removeEventListener('blur', blurHandler);
        });

        container.appendChild(input);

        return [container];
    }

    async renderBak(node: OdooFieldNode | OMonetaryFieldNode): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);
        let fieldContainer = container;

        // Special case 4/4 for monetary field.
        if (node instanceof OMonetaryFieldNode) {
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
