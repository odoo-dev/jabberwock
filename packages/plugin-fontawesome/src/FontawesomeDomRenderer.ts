import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FontawesomeNode } from './FontawesomeNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class FontawesomeDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = FontawesomeNode;

    async render(node: FontawesomeNode): Promise<Node[]> {
        const fontawesome = document.createElement(node.htmlTag);
        this.engine.renderAttributes(node.attributes, fontawesome);
        return [fontawesome];
    }
}
