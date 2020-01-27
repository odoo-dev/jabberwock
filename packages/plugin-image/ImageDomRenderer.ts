import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { ImageNode } from './ImageNode';

export class ImageDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    predicate = ImageNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        for (const name of Object.keys(node.attributes)) {
            const value = node.attributes[name];
            if (typeof value === 'string') {
                image.setAttribute(name, value);
            }
        }
        return [image];
    }
}
