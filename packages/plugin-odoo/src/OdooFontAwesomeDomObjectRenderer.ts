import { FontAwesomeNode } from '../../plugin-fontawesome/src/FontAwesomeNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { FontAwesomeDomObjectRenderer } from '../../plugin-fontawesome/src/FontAwesomeDomObjectRenderer';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { RelativePosition } from '../../core/src/VNodes/VNode';

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
                    const faZoomClassRegex = RegExp('fa-[0-9]x');
                    function filterUnwantedClasses(className) {
                        return !className.startsWith('fa') || faZoomClassRegex.test(className);
                    }
                    // Customize the look and behavior of the media modal when
                    // the origin of the media modal is a FA icon double click
                    const params = {
                        noImages: true,
                        noDocuments: true,
                        noVideos: true,
                        htmlClass: [...fa.attributes.class].filter(filterUnwantedClasses).join(' '),
                    };

                    this.engine.editor.execCommand('openMedia', params);
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
