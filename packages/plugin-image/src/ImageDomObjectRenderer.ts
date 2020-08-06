import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ImageNode } from './ImageNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class ImageDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const select = (): void => {
            this.engine.editor.nextEventMutex(() => {
                return this.engine.editor.execCommand(async () => {
                    this.engine.editor.selection.select(node, node);
                });
            });
        };
        const image: DomObject = {
            tag: 'IMG',
            attach: (el: HTMLElement): void => {
                el.addEventListener('click', select);
            },
            detach: (el: HTMLElement): void => {
                el.removeEventListener('click', select);
            },
        };
        const isSelected = this.engine.editor.selection.range.selectedNodes(
            selectedNode => selectedNode === node,
        ).length;
        if (isSelected) {
            image.attributes = { class: new Set(['jw_selected_image']) };
        }
        worker.locate([node], image);
        return image;
    }
}
