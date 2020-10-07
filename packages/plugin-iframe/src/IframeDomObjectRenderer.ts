import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { DomObjectElement } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { IframeNode } from './IframeNode';

export class IframeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = IframeNode;

    async render(
        iframeNode: IframeNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObject> {
        let onload: () => void;
        const object: DomObjectElement = {
            tag: 'iframe',
            attach: (iframe: HTMLIFrameElement) => {
                onload = (): void => {
                    // Bubbles up the load-iframe event.
                    const customEvent = new CustomEvent('load-iframe', {
                        bubbles: true,
                        composed: true,
                        cancelable: true,
                    });
                    iframe.dispatchEvent(customEvent);
                };
                iframe.addEventListener('load', onload);
            },
            detach: (iframe: HTMLIFrameElement) => {
                iframe.removeEventListener('load', onload);
            },
        };
        this.engine.renderAttributes(Attributes, iframeNode, object, worker);

        return object;
    }
}
