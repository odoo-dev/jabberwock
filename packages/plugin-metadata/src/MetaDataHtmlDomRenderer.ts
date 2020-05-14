import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { MetadataNode } from './MetadataNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class MetadataHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = MetadataNode;

    async render(node: MetadataNode): Promise<Node[]> {
        const domNode = document.createElement(node.htmlTag);
        this.engine.renderAttributes(Attributes, node, domNode);
        domNode.innerHTML = node.contents;
        return [domNode];
    }
}
