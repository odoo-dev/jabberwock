import { AbstractRenderer } from '../../core/src/AbstractRenderer';
import { YoutubeNode } from './YoutubeNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class YoutubeDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = YoutubeNode;

    async render(node: YoutubeNode): Promise<Node[]> {
        const youtube = document.createElement('iframe');
        this.engine.renderAttributes(node.attributes, youtube);
        return [youtube];
    }
}
