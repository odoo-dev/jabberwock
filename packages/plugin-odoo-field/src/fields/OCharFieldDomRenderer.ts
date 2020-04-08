import { OdooFieldNode } from '../OdooFieldNode';
import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { OdooFieldDomRenderer } from '../OdooFieldDomRenderer';
import { OCharFieldNode } from '../OCharFieldNode';

export class OCharFieldDomRenderer extends OdooFieldDomRenderer {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OCharFieldNode;

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('value', node.fieldInfo.value.get());
        return input;
    }
}
