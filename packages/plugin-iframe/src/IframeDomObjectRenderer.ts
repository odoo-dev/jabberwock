import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { IframeNode } from './IframeNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class IframeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = IframeNode;

    async render(iframeNode: IframeNode): Promise<DomObject> {
        let onload: (ev: Event) => void;
        const domObject: DomObject = {
            tag: 'IFRAME',
            children: [
                {
                    tag: 'JW-IFRAME',
                    shadowRoot: true,
                    children: iframeNode.childVNodes.filter(
                        child => child.tangible || child.is(MetadataNode),
                    ),
                    attach: (wrap: HTMLElement): void => {
                        if (wrap.parentElement instanceof HTMLIFrameElement) {
                            const body = wrap.parentElement.contentWindow?.document.body;
                            if (body) {
                                body.appendChild(wrap);
                            }
                        }
                    },
                },
            ],
            attach: (iframe: HTMLIFrameElement) => {
                onload = (ev: Event): void => {
                    if (!ev.isTrusted) {
                        return;
                    }
                    if (!iframe.src) {
                        const doc = iframe.contentWindow.document;
                        const body = doc.body;
                        body.style.margin = '0px';
                        body.append(...iframe.childNodes);
                    }
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
                if (!iframe.src) {
                    const body = iframe.contentWindow?.document.body;
                    if (body) {
                        iframe.append(...body.childNodes);
                    }
                }
                iframe.removeEventListener('load', onload);
            },
        };
        this.engine.renderAttributes(Attributes, iframeNode, domObject);
        return domObject;
    }
}
