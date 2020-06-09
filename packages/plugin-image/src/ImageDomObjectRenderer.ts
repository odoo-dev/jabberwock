import { InlineFormatDomObjectRenderer } from '../../plugin-inline/src/InlineFormatDomObjectRenderer';
import { ImageNode } from './ImageNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Format } from '../../plugin-inline/src/Format';

export class ImageDomObjectRenderer extends InlineFormatDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ImageNode;

    async render(node: ImageNode): Promise<DomObject> {
        const select = (): void => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCustomCommand(async () => {
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
        this.engine.renderAttributes(Attributes, node, image);
        const isSelected = !!this.engine.editor.selection.range.selectedNodes(
            selectedNode => selectedNode === node,
        );
        if (isSelected) {
            const classlist = (image.attributes?.class || '').split(/\s+/);
            classlist.push('jw_selected_image');
            image.attributes.class = classlist.join('');
        }
        this.engine.locate([node], image);
        return this.renderFormats(node.modifiers.filter(Format), image);
    }
}
