import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { YoutubeNode } from './YoutubeNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class YoutubeHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = YoutubeNode;

    async render(node: YoutubeNode): Promise<Node[]> {
        const youtube = document.createElement('iframe');
        const attributes = node.modifiers.get(Attributes);
        if (attributes) {
            this.engine.renderAttributes(attributes, youtube);
        }
        return [youtube];
    }
}
