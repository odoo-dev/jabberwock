import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { MetadataNode } from './MetadataNode';

export class MetadataHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = MetadataNode;

    async render(node: MetadataNode): Promise<Node[]> {
        const domNode = document.createElement(node.htmlTag);
        this.engine.renderAttributes(node.attributes, domNode);
        domNode.innerHTML = node.contents;
        return [domNode];
    }
}
