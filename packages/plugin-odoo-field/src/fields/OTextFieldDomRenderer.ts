import { OdooFieldNode } from '../OdooFieldNode';
import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { OdooFieldDomRenderer } from '../OdooFieldDomRenderer';
import { OTextFieldNode } from '../OTextFieldNode';

export class OTextFieldDomRenderer extends OdooFieldDomRenderer {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OTextFieldNode;

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        const input = document.createElement('textarea');
        input.value = node.fieldInfo.value.get();
        return input;
    }
}
