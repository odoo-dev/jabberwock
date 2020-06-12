import { InlineFormatDomObjectRenderer } from '../../plugin-inline/src/InlineFormatDomObjectRenderer';
import { ImageNode } from './ImageNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ImageDomObjectRenderer extends InlineFormatDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ImageNode;
    createSpanForAttributes = false;

    async renderInline(nodes: ImageNode[]): Promise<DomObject[]> {
        const rendering = nodes.map(node => {
            const image: DomObject = {
                tag: 'IMG',
            };
            this.engine.renderAttributes(Attributes, node, image);
            this.engine.locate([node], image);
            return image;
        });
        return Promise.all(rendering);
    }
}
