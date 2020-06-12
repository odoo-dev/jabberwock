import { PreNode } from './PreNode';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { CharDomObjectRenderer } from '../../plugin-char/src/CharDomObjectRenderer';
import { DomObjectText } from '../../plugin-html/src/DomObjectRenderingEngine';

export class PreCharDomObjectRenderer extends CharDomObjectRenderer {
    predicate: Predicate = (item: VNode): boolean =>
        item instanceof CharNode && !!item.ancestor(PreNode);
    /**
     * Render the CharNode and convert unbreakable spaces into normal spaces.
     */
    async renderInline(charNodes: CharNode[]): Promise<DomObjectText[]> {
        const [domObject] = await super.renderInline(charNodes);
        if ('text' in domObject) {
            domObject.text = domObject.text.replace(/\u00A0/g, ' ');
        }
        return [domObject];
    }
}
