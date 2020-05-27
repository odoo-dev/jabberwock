import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooVideoNode } from './OdooVideoNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Core } from '../../core/src/Core';
import { Direction } from '../../core/src/VSelection';

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
        wrapper.querySelector('.css_editable_mode_display').addEventListener('click', () => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCommand<Core>('setSelection', {
                    vSelection: {
                        anchorNode: node,
                        direction: Direction.FORWARD,
                    },
                });
            });
        });
        wrapper.querySelector('.css_editable_mode_display').addEventListener('dblclick', () => {
            this.engine.editor.nextEventMutex(() => {
                this.engine.editor.execCommand('openMedia');
            });
        });
        return [wrapper];
    }
}
