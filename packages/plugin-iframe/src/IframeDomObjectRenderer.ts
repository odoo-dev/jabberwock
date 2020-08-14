import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { IframeNode } from './IframeNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { VNode } from '../../core/src/VNodes/VNode';

export class IframeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = IframeNode;

    async render(iframeNode: IframeNode): Promise<DomObject> {
        let onload: (ev: Event) => void;
        const children: VNode[] = [];
        iframeNode.childVNodes.forEach(child => {
            if (child.tangible || child instanceof MetadataNode) {
                children.push(child);
            }
        });
        const domObject: DomObject = {
            children: [
                {
                    tag: 'JW-IFRAME',
                    shadowRoot: true,
                    children: children,
                },
                {
                    tag: 'IFRAME',
                    attributes: { src: iframeNode.src },
                    attach: (iframe: HTMLIFrameElement): void => {
                        const wrap = iframe.previousElementSibling as HTMLElement;
                        wrap.style.display = 'none';
                        onload = (ev: Event): void => {
                            if (!ev.isTrusted) {
                                return;
                            }
                            if (!iframeNode.src) {
                                const doc = iframe.contentWindow.document;
                                const body = doc.body;
                                body.style.margin = '0px';

                                for (const attr of wrap.attributes) {
                                    wrap.removeAttribute(attr.name);
                                }
                                body.innerHTML = '';
                                body.append(wrap);
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
                    detach: (iframe: HTMLIFrameElement): void => {
                        if (!iframe.src) {
                            const body = iframe.contentWindow?.document.body;
                            if (body) {
                                iframe.append(...body.childNodes);
                            }
                        }
                        iframe.removeEventListener('load', onload);
                    },
                },
            ],
        };
        return domObject;
    }
}
