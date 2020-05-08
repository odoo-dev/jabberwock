import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { InputNode } from './InputNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class InputHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = InputNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: InputNode): Promise<Node[]> {
        const input = document.createElement('input');
        this.engine.renderAttributes(node.attributes, input);
        input.value = node.value;
        return [input];
    }
}
