import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { IframeNode } from './IframeNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { nodeName } from '../../utils/src/utils';

export class IframeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = IframeNode;

    async render(iframeNode: IframeNode): Promise<DomObject> {
        let onload: () => void;
        const children: VNode[] = [];
        iframeNode.childVNodes.forEach(child => {
            if (child.tangible || child instanceof MetadataNode) {
                children.push(child);
            }
        });
        let wrap: HTMLElement;
        const domObject: DomObject = {
            children: [
                {
                    tag: 'JW-IFRAME',
                    shadowRoot: true,
                    children: children,
                },
                {
                    tag: 'IFRAME',
                    attributes: {
                        // Can not use the default href loading in testing mode because the port is
                        // used for the log, and the iframe are never loaded.
                        // Use the window.location.href to keep style, link and meta to load some
                        // data like the font-face. The style are not really used into the shadow
                        // container but we need the real url to load font-face with relative path.
                        src: iframeNode.src || window.location.href,
                        name: 'jw-device',
                    },
                    attach: (iframe: HTMLIFrameElement): void => {
                        const prev = iframe.previousElementSibling as HTMLElement;
                        if (nodeName(prev) === 'JW-IFRAME') {
                            if (wrap) {
                                wrap.replaceWith(prev);
                            } else {
                                prev.style.display = 'none';
                            }
                            wrap = prev;
                        }

                        if (iframeNode.src) {
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
                        } else {
                            (function loadWithPreloadedMeta(): void {
                                // Remove all scripts, keep style, link and meta to load some
                                // data like the font-face. The style are not used into the
                                // shadow container.
                                if (iframe.previousElementSibling !== wrap) {
                                    return;
                                } else {
                                    const doc = iframe.contentWindow?.document;
                                    if (doc && (doc.head || doc.body)) {
                                        for (const meta of wrap.shadowRoot.querySelectorAll(
                                            'style, link, meta',
                                        )) {
                                            doc.write(meta.outerHTML);
                                        }
                                        doc.write('<body></body>');
                                        doc.write("<script type='application/x-suppress'>");
                                        iframe.contentWindow.close();

                                        setTimeout((): void => {
                                            const doc = iframe.contentWindow.document;
                                            // Remove all attribute from the shadow container.
                                            for (const attr of [...wrap.attributes]) {
                                                wrap.removeAttribute(attr.name);
                                            }
                                            doc.body.style.margin = '0px';
                                            doc.body.innerHTML = '';
                                            doc.body.append(wrap);

                                            // Bubbles up the load-iframe event.
                                            const customEvent = new CustomEvent('load-iframe', {
                                                bubbles: true,
                                                composed: true,
                                                cancelable: true,
                                            });
                                            iframe.dispatchEvent(customEvent);
                                        });
                                    } else {
                                        setTimeout(loadWithPreloadedMeta);
                                    }
                                }
                            })();
                        }
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
