import { ImageDomObjectRenderer } from '../../plugin-image/src/ImageDomObjectRenderer';
import { ImageNode } from '../../plugin-image/src/ImageNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class OdooImageDomObjectRenderer extends ImageDomObjectRenderer {
    predicate = ImageNode;

    async render(node: ImageNode): Promise<DomObject> {
        const image = await this.super.render(node);
        if (image && 'tag' in image) {
            const savedAttach = image.attach;
            const savedDetach = image.detach;
            const handleClick = (): void => {
                const params = { image: node };
                this.engine.editor.execCommand('openMedia', params);
            };
            image.attach = (el: HTMLElement): void => {
                if (savedAttach) {
                    savedAttach(el);
                }
                el.addEventListener('dblclick', handleClick);
            };

            image.detach = (el: HTMLElement): void => {
                if (savedDetach) {
                    savedDetach(el);
                }
                el.removeEventListener('dblclick', handleClick);
            };
        }
        return image;
    }
}
