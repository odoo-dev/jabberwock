import { FormatDomObjectModifierRenderer } from '../../plugin-renderer-dom-object/src/FormatDomObjectModifierRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Format } from '../../core/src/Format';
import { LinkFormat } from '../../plugin-link/src/LinkFormat';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Core } from '../../core/src/Core';
import { Direction } from '../../core/src/VSelection';
import { RelativePosition } from '../../core/src/VNodes/VNode';

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
            let dbclickCallback: (ev: MouseEvent) => Promise<void>;
            const savedAttach = link.attach;
            link.attach = (el: HTMLElement): void => {
                dbclickCallback = async (ev: MouseEvent): Promise<void> => {
                    ev.preventDefault();
                    const layout = this.engine.editor.plugins.get(Layout);
                    const domEngine = layout.engines.dom as DomLayoutEngine;
                    const nodes = domEngine.getNodes(el);
                    await this.engine.editor.execCommand<Core>('setSelection', {
                        vSelection: {
                            anchorNode: nodes[0],
                            anchorPosition: RelativePosition.BEFORE,
                            focusNode: nodes[nodes.length - 1],
                            focusPosition: RelativePosition.AFTER,
                            direction: Direction.FORWARD,
                        },
                    });
                    this.engine.editor.execCommand('openLinkDialog');
                };
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
