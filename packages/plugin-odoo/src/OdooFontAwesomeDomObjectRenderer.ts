import { FontAwesomeNode } from '../../plugin-fontawesome/src/FontAwesomeNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { FontAwesomeDomObjectRenderer } from '../../plugin-fontawesome/src/FontAwesomeDomObjectRenderer';

export class OdooFontAwesomeDomObjectRenderer extends FontAwesomeDomObjectRenderer {
    predicate = FontAwesomeNode;

    async render(node: FontAwesomeNode): Promise<DomObject> {
        const domObject: DomObject = await super.render(node);
        if (domObject && 'children' in domObject) {
            const fa = domObject.children[1];
            if ('tag' in fa) {
                const savedAttach = fa.attach;
                fa.attach = (el: HTMLElement): void => {
                    if (savedAttach) {
                        savedAttach(el);
                    }
                    el.addEventListener('dblclick', () => {
                        const params = { image: node };
                        this.engine.editor.execCommand('openMedia', params);
                    });
                };
            }
        }
        return domObject;
    }
}
