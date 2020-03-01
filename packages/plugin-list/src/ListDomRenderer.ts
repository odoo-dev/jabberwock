import { AbstractRenderer } from '../../core/src/AbstractRenderer';
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

        for (const child of node.children) {
            const renderedChild = await this.engine.render(child);
            let container: Node = domListNode;
            const previousSibling = child.previousSibling();
            // Indented lists are rendered in the LI that precedes them, if any.
            // eg.: <ul><li>title: <ul><li>indented</li></ul></ul>
            if (child.is(ListNode) && previousSibling) {
                const rendering = await this.engine.render(previousSibling);
                const domPreviousSibling = rendering[rendering.length - 1];
                if (domPreviousSibling.nodeName === 'LI') {
                    container = domPreviousSibling;
                }
            }
            for (const domChild of renderedChild) {
                container.appendChild(domChild);
            }
        }

        return [domListNode];
    }
}