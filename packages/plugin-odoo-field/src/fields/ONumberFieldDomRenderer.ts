import { ONumberFieldNode } from './../ONumberFieldNode';
import { OdooFieldNode } from '../OdooFieldNode';
import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { OdooFieldDomRenderer } from '../OdooFieldDomRenderer';

export class ONumberFieldDomRenderer extends OdooFieldDomRenderer {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = ONumberFieldNode;

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        const input = document.createElement('input');

        const value = node.fieldInfo.value.get();
        const parsedValue = parseInt(value.replace(/\D/g, ''));
        input.setAttribute('type', 'number');
        input.setAttribute('value', parsedValue);

        return input;
    }
}
