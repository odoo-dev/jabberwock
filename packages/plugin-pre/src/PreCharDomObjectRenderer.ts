import { PreNode } from './PreNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export class PreCharDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;

    predicate = (item: VNode): boolean => item.is(CharNode) && !!item.ancestor(PreNode);

    /**
     * Render the VNode to the given format.
     */
    async render(node: CharNode): Promise<DomObject> {
        const rendering = await this.super.render(node);
        const renderedNodes: VNode[] = [node];
        const toProcess = [rendering];
        for (const domObject of toProcess) {
            // Locate the original VNodes from the renderings to override it
            // with the modified rendering from Pre.
            const nodes = this.engine.locations.get(rendering);
            if (nodes) {
                renderedNodes.push(...nodes);
            }
            if ('text' in domObject) {
                domObject.text = domObject.text.replace(/\u00A0/g, ' ');
            } else if ('children' in domObject) {
                for (const child of domObject.children) {
                    if (!(child instanceof AbstractNode)) {
                        toProcess.push(child);
                    }
                }
            }
        }
        return this.engine.rendered(renderedNodes, this, Promise.resolve(rendering));
    }
}
