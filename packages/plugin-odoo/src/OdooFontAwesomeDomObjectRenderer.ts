import { FontAwesomeNode } from '../../plugin-fontawesome/src/FontAwesomeNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { FontAwesomeDomObjectRenderer } from '../../plugin-fontawesome/src/FontAwesomeDomObjectRenderer';

export class OdooFontAwesomeDomObjectRenderer extends FontAwesomeDomObjectRenderer {
    predicate = FontAwesomeNode;

    async renderInline(nodes: FontAwesomeNode[]): Promise<DomObject[]> {
        const rendering: DomObject[] = await super.renderInline(nodes);
        for (let index = 0; index < nodes.length; index++) {
            const domObject = rendering[index];
            if (domObject && 'children' in domObject) {
                const fa = domObject.children[1];
                if ('tag' in fa) {
                    const savedAttach = fa.attach;
                    fa.attach = (el: HTMLElement): void => {
                        if (savedAttach) {
                            savedAttach(el);
                        }
                        el.addEventListener('dblclick', () => {
                            const params = { image: nodes[index] };
                            this.engine.editor.execCommand('openMedia', params);
                        });
                    };
                }
            }
        }
        return rendering;
    }
}
