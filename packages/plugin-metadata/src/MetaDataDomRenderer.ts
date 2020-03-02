import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { MetadataNode } from './MetadataNode';

export class MetadataDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = MetadataNode;

    async render(node: MetadataNode): Promise<Node[]> {
        const domNode = document.createElement(node.htmlTag);
        this.engine.renderAttributes(node.attributes, domNode);
        domNode.innerHTML = node.contents;
        return [domNode];
    }
}
