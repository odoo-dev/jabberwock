import { AbstractRenderer } from '../../core/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class ImageDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        this.engine.renderAttributes(node.attributes, image);
        return [image];
    }
}
