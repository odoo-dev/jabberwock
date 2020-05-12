import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ImageHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        const attributes = node.modifiers.find(Attributes);
        if (attributes) {
            this.engine.renderAttributes(attributes, image);
        }
        return [image];
    }
}
