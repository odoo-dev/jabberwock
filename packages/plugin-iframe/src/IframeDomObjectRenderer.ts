import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { IframeNode } from './IframeNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { nodeName, isInstanceOf } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { DomObjectElement } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

const EventForwarded = ['selectionchange', 'blur', 'focus', 'mousedown', 'touchstart', 'keydown'];
const forwardEventOutsideIframe = (ev: UIEvent): void => {
    const target = ev.target;
    let customEvent: Event;
    let win: Window;
    if (isInstanceOf(target, Document)) {
        win = target.defaultView;
    } else if (isInstanceOf(target, Node)) {
        win = target.ownerDocument.defaultView;
    } else if (isInstanceOf(ev.currentTarget, Node)) {
        win = ev.currentTarget.ownerDocument.defaultView;
    } else if (
        isInstanceOf(ev.currentTarget, Window) &&
        ev.currentTarget.self === ev.currentTarget
    ) {
        win = ev.currentTarget;
    } else {
        win = ev.view || (ev.target as Window);
    }

    const iframe = win.frameElement;
    if (ev.type === 'mousedown') {
        const rect = iframe.getBoundingClientRect();
        customEvent = new MouseEvent(ev.type + '-iframe', {
            bubbles: true,
            composed: true,
            cancelable: true,
            clientX: (ev as MouseEvent).clientX + rect.x,
            clientY: (ev as MouseEvent).clientY + rect.y,
        });
    } else if (ev.type === 'touchstart') {
        const rect = iframe.getBoundingClientRect();
        customEvent = new MouseEvent('mousedown-iframe', {
            bubbles: true,
            composed: true,
            cancelable: true,
            clientX: (ev as TouchEvent).touches[0].clientX + rect.x,
            clientY: (ev as TouchEvent).touches[0].clientY + rect.y,
        });
    } else if (ev.type === 'keydown') {
        customEvent = new KeyboardEvent('keydown-iframe', {
            bubbles: true,
            composed: true,
            cancelable: true,
            altKey: (ev as KeyboardEvent).altKey,
            ctrlKey: (ev as KeyboardEvent).ctrlKey,
            shiftKey: (ev as KeyboardEvent).shiftKey,
            metaKey: (ev as KeyboardEvent).metaKey,
            key: (ev as KeyboardEvent).key,
            code: (ev as KeyboardEvent).code,
        });
    } else {
        customEvent = new CustomEvent(ev.type + '-iframe', {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
    }

    const preventDefault = customEvent.preventDefault.bind(customEvent);
    customEvent.preventDefault = (): void => {
        ev.preventDefault();
        preventDefault();
    };

    const stopPropagation = customEvent.stopPropagation.bind(customEvent);
    customEvent.stopPropagation = (): void => {
        ev.stopPropagation();
        stopPropagation();
    };

    const stopImmediatePropagation = customEvent.stopImmediatePropagation.bind(customEvent);
    customEvent.stopImmediatePropagation = (): void => {
        ev.stopImmediatePropagation();
        stopImmediatePropagation();
    };

    iframe.dispatchEvent(customEvent);
};

export class IframeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = IframeNode;

    async render(
        iframeNode: IframeNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObject> {
        if (iframeNode.src) {
            const object: DomObjectElement = {
                tag: 'IFRAME',
            };
            this.engine.renderAttributes(Attributes, iframeNode, object, worker);
            object.attributes.src = iframeNode.src;
            return object;
        }
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
                                            const win = iframe.contentWindow;
                                            const doc = win.document;
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
                                            EventForwarded.forEach(eventName => {
                                                win.addEventListener(
                                                    eventName,
                                                    forwardEventOutsideIframe,
                                                    true,
                                                );
                                                win.addEventListener(
                                                    eventName + '-iframe',
                                                    forwardEventOutsideIframe,
                                                    true,
                                                );
                                            });
                                        });
                                    } else {
                                        setTimeout(loadWithPreloadedMeta);
                                    }
                                }
                            })();
                        }
                    },
                    detach: (iframe: HTMLIFrameElement): void => {
                        if (!iframe.src && iframe.contentWindow) {
                            const win = iframe.contentWindow;
                            EventForwarded.forEach(eventName => {
                                win.removeEventListener(eventName, forwardEventOutsideIframe, true);
                                win.removeEventListener(
                                    eventName + '-iframe',
                                    forwardEventOutsideIframe,
                                    true,
                                );
                            });
                        }
                        iframe.removeEventListener('load', onload);
                    },
                },
            ],
        };
        return domObject;
    }
}
