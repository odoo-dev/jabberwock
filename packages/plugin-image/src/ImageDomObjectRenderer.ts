import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ImageDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<DomObject> {
        const image: DomObject = {
            tag: 'IMG',
        };
        this.engine.renderAttributes(Attributes, node, image);
        return image;
    }
}
