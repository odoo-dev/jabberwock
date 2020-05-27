import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ImageNode } from './ImageNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { YoutubeNode } from '../../plugin-youtube/src/YoutubeNode';

export class ImageHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = (node): boolean => node.is(ImageNode) || node.is(YoutubeNode);

    async render(node: ImageNode): Promise<Node[]> {
        const image = document.createElement('img');
        const isSelected = !!this.engine.editor.selection.range.selectedNodes(
            selectedNode => selectedNode === node,
        );
        if (isSelected) {
            image.classList.add('jw_selected_image');
        }
        image.addEventListener('click', () => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCustomCommand(async () => {
                    this.engine.editor.selection.select(node, node);
                });
            });
        });
        this.engine.renderAttributes(Attributes, node, image);
        return [image];
    }
}
