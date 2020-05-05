import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class ImageHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        this.engine.renderAttributes(node.attributes, image);
        return [image];
    }
}
