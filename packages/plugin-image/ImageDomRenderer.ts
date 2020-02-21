import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import { DomRenderingEngine } from '../plugin-dom/DomRenderingEngine';

export class ImageDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = ImageNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        this.engine.renderAttributesTo(node.attributes, image);
        return [image];
    }
}
