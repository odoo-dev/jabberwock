import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ListNode, ListType } from './ListNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

import './ui/checklist.css';

export class ListHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ListNode;

    async render(node: ListNode): Promise<Node[]> {
        const tag = node.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        this.engine.renderAttributes(Attributes, node, domListNode);
        if (ListNode.CHECKLIST(node)) {
            domListNode.classList.add('checklist');
        }
        const renderedChildren = await this.renderChildren(node);
        domListNode.append(...renderedChildren.flat());
        return [domListNode];
    }
}
