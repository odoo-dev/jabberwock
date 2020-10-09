import { FormatDomObjectModifierRenderer } from '../../plugin-renderer-dom-object/src/FormatDomObjectModifierRenderer';
import { DomObjectRenderingEngine, DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Format } from '../../core/src/Format';
import { LinkFormat } from '../../plugin-link/src/LinkFormat';

export class LinkFormatDomObjectModifierRenderer extends FormatDomObjectModifierRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LinkFormat;

    /**
     * @override
     */
    async render(format: Format, contents: DomObject[]): Promise<DomObject[]> {
        const domObjects = await super.render(format, contents);
        const link = domObjects[0];
        if ('tag' in link) {
            const dbclickCallback = (): void => {
                this.engine.editor.execCommand('openLinkDialog');
            };

            const savedAttach = link.attach;
            link.attach = (el: HTMLElement): void => {
                if (savedAttach) {
                    savedAttach(el);
                }
                el.addEventListener('dblclick', dbclickCallback);
            };
            const savedDetach = link.detach;
            link.detach = (el: HTMLElement): void => {
                if (savedDetach) {
                    savedDetach(el);
                }
                el.removeEventListener('dblclick', dbclickCallback);
            };
        }
        return domObjects;
    }
}
