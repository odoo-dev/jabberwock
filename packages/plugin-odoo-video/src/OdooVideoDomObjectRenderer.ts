import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooVideoNode } from './OdooVideoNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';

export class OdooVideoHtmlDomRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = OdooVideoNode;

    async render(node: OdooVideoNode): Promise<DomObject> {
        const wrapper: DomObject = {
            tag: 'DIV',
            attributes: { class: 'media_iframe_video', 'data-oe-expression': node.src },
            children: [
                {
                    tag: 'DIV',
                    attributes: { class: 'css_editable_mode_display' },
                    children: [{ text: '\u00A0' }],
                },
                {
                    tag: 'DIV',
                    attributes: { class: 'media_iframe_video_size' },
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
