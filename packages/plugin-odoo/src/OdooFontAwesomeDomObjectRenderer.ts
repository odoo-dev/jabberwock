import { FontAwesomeNode } from '../../plugin-fontawesome/src/FontAwesomeNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { FontAwesomeDomObjectRenderer } from '../../plugin-fontawesome/src/FontAwesomeDomObjectRenderer';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class OdooFontAwesomeDomObjectRenderer extends FontAwesomeDomObjectRenderer {
    predicate = FontAwesomeNode;

    async render(
        node: FontAwesomeNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObject> {
        const domObject: DomObject = await super.render(node, worker);
        if (domObject && 'children' in domObject) {
            const fa = domObject.children[1];

            if ('tag' in fa) {
                const dbclickCallback = () => {
                    this.engine.editor.execCommand('openMedia', {});
                };

                const savedAttach = fa.attach;
                fa.attach = (el: HTMLElement): void => {
                    if (savedAttach) {
                        savedAttach(el);
                    }
                    el.addEventListener('dblclick', dbclickCallback);
                };
                const savedDetach = fa.detach;
                fa.detach = (el: HTMLElement): void => {
                    if (savedDetach) {
                        savedDetach(el);
                    }
                    el.removeEventListener('dblclick', dbclickCallback);
                };
            }
        }
        return domObject;
    }
}
