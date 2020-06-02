import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { InputNode } from './InputNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class InputHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = InputNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: InputNode): Promise<Node[]> {
        const input = document.createElement('input');
        const attributes = node.modifiers.find(Attributes);
        if (attributes) {
            this.engine.renderAttributes(Attributes, node, input);
        }
        if (node.inputType) {
            input.setAttribute('type', node.inputType);
        }
        if (node.inputName) {
            input.setAttribute('name', node.inputName);
        }
        input.value = node.value;
        return [input];
    }
}
