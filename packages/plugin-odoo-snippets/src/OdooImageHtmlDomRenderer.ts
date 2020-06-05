import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { ImageNode } from '../../plugin-image/src/ImageNode';
import { nodeName } from '../../utils/src/utils';

export class OdooImageHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<Node[]> {
        const nodes = await this.super.render(node);
        const image = nodes.length && nodes.find(node => nodeName(node) === 'IMG');
        if (image) {
            image.addEventListener('dblclick', () => {
                const params = { image: node };
                this.engine.editor.execCommand('openMedia', params);
            });
        }
        return nodes;
    }
}
