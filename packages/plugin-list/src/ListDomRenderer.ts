import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ListNode, ListType } from './ListNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class ListDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = ListNode;

    async render(node: ListNode): Promise<Node[]> {
        const tag = node.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        this.engine.renderAttributes(node.attributes, domListNode);

        for (const child of node.childVNodes) {
            const renderedChild = await this.engine.render(child);
            for (const domChild of renderedChild) {
                domListNode.appendChild(domChild);
            }
        }

        return [domListNode];
    }
}
