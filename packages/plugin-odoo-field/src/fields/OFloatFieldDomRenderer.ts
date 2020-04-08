import { OdooFieldNode } from '../OdooFieldNode';
import { ReactiveValue } from '../../../utils/src/ReactiveValue';
import { OFloatFieldNode } from '../OFloatFieldNode';
import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { OdooFieldDomRenderer } from '../OdooFieldDomRenderer';

// todo: get the decimal separator from odoo;
const decimalSeparator = '.';

export class OFloatFieldDomRenderer extends OdooFieldDomRenderer {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OFloatFieldNode;

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        const input = document.createElement('input');

        const value = node.fieldInfo.value.get();
        const splitedValue = value.split(decimalSeparator);
        const beforeDecimal = parseInt(splitedValue[0].replace(/\D/g, ''));
        const afterDecimal = splitedValue[1];
        const inputValue = afterDecimal ? beforeDecimal + '.' + afterDecimal : beforeDecimal;

        input.setAttribute('type', 'number');
        input.setAttribute('step', `0.01`);
        input.setAttribute('value', inputValue);

        return input;
    }
}
