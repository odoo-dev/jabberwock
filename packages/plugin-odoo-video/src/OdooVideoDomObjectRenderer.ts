import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { OdooVideoNode } from './OdooVideoNode';
import { Core } from '../../core/src/Core';
import { Direction } from '../../core/src/VSelection';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class OdooVideoHtmlDomRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = OdooVideoNode;

    async render(node: OdooVideoNode): Promise<DomObject> {
        const setSelection = (): void => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCommand<Core>('setSelection', {
                    vSelection: {
                        anchorNode: node,
                        direction: Direction.FORWARD,
                    },
                });
            });
        };
        const openMedia = (): void => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCommand('openMedia');
            });
        };
        const wrapper: DomObject = {
            tag: 'DIV',
            attributes: {
                class: new Set(['media_iframe_video']),
                'data-oe-expression': node.src,
            },
            children: [
                {
                    tag: 'DIV',
                    attributes: { class: new Set(['css_editable_mode_display']) },
                    children: [{ text: '\u00A0' }],
                    attach: (el: HTMLElement): void => {
                        el.addEventListener('click', setSelection);
                        el.addEventListener('dblclick', openMedia);
                    },
                    detach: (el: HTMLElement): void => {
                        el.removeEventListener('click', setSelection);
                        el.removeEventListener('dblclick', openMedia);
                    },
                },
                {
                    tag: 'DIV',
                    attributes: { class: new Set(['media_iframe_video_size']) },
                    children: [{ text: '\u00A0' }],
                },
                {
                    tag: 'IFRAME',
                    attributes: {
                        src: node.src,
                        frameborder: '0',
                        allowfullscreen: 'allowfullscreen',
                    },
                },
            ],
        };
        return wrapper;
    }
}
