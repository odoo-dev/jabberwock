import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ListNode, ListType } from './ListNode';
import { ChecklistNode } from './ChecklistNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

import './ui/listCheckbox.css';

export class ListDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = ListNode;

    async render(node: ListNode): Promise<Node[]> {
        const tag = node.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        this.engine.renderAttributes(node.attributes, domListNode);
        if (node.is(ChecklistNode)) {
            domListNode.classList.add('checklist');
        }

        for (const child of node.childVNodes) {
            const renderedChild = await this.engine.render(child);
            for (const domChild of renderedChild) {
                domListNode.appendChild(domChild);
            }
        }

        return [domListNode];
    }
}
