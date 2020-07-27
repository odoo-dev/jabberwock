import { PreNode } from './PreNode';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { CharDomObjectRenderer } from '../../plugin-char/src/CharDomObjectRenderer';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export class PreCharDomObjectRenderer extends CharDomObjectRenderer {
    predicate: Predicate = (item: VNode): boolean =>
        item instanceof CharNode && !!item.ancestor(PreNode);

    async render(charNode: CharNode): Promise<DomObject> {
        const domObject = await super.render(charNode);
        this._renderInPre([domObject]);
        return domObject;
    }
    /**
     * Render the CharNode and convert unbreakable spaces into normal spaces.
     */
    async renderBatch(charNodes: CharNode[]): Promise<DomObject[]> {
        const domObjects = await super.renderBatch(charNodes);
        this._renderInPre(domObjects);
        return domObjects;
    }
    private _renderInPre(domObjects: DomObject[]): void {
        const stack = [...domObjects];
        for (const domObject of stack) {
            if ('text' in domObject) {
                domObject.text = domObject.text
                    .replace(/\u00A0/g, ' ')
                    .replace(/\u2003/g, '\u0009');
            }
            if ('children' in domObject) {
                for (const child of domObject.children) {
                    if (!(child instanceof AbstractNode)) {
                        stack.push(child);
                    }
                }
            }
        }
    }
}
