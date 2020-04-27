import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { YoutubeNode } from './YoutubeNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class YoutubeHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = YoutubeNode;

    async render(node: YoutubeNode): Promise<Node[]> {
        const youtube = document.createElement('iframe');
        this.engine.renderAttributes(node.attributes, youtube);
        return [youtube];
    }
}
