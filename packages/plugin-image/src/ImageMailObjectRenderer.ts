import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ImageNode } from './ImageNode';
import {
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MailObjectRenderingEngine } from '../../plugin-mail/src/MailObjectRenderingEngine';
import { MailRenderingEngineWorker } from '../../plugin-mail/src/MailRenderingEngineCache';

export class ImageMailObjectRenderer extends NodeRenderer<DomObject> {
    static id = MailObjectRenderingEngine.id;
    engine: MailObjectRenderingEngine;
    predicate = ImageNode;

    /**
     * Special rendering for mail clients.
     *
     * @override
     */
    async render(img: ImageNode, worker: MailRenderingEngineWorker): Promise<DomObject> {
        const imgObject = (await this.super.render(img, worker)) as DomObjectElement;

        // Center image on Outlook.
        if (
            imgObject.attributes.class.has('mx-auto') &&
            imgObject.attributes.class.has('d-block')
        ) {
            return {
                tag: 'P',
                attributes: {
                    style: { 'text-align': 'center', 'margin': '0' },
                },
                children: [imgObject],
            };
        }
        return imgObject;
    }
}
