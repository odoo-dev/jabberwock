import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooVideoNode } from './OdooVideoNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class OdooVideoHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = OdooVideoNode;

    async render(node: OdooVideoNode): Promise<Node[]> {
        const wrapper = document.createElement('div');
        wrapper.classList.add('media_iframe_video');
        wrapper.setAttribute('data-oe-expression', node.src);
        wrapper.innerHTML = [
            `<div class="css_editable_mode_display">&nbsp;</div>`,
            `<div class="media_iframe_video_size">&nbsp;</div>`,
            `<iframe src="${node.src}" frameborder="0" allowfullscreen="allowfullscreen"></iframe>`,
        ].join('');
        return [wrapper];
    }
}
