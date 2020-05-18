import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ListNode, ListType } from './ListNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ListHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ListNode;

    async render(node: ListNode): Promise<Node[]> {
        const tag = node.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        this.engine.renderAttributes(Attributes, node, domListNode);
        const renderedChildren = await this.renderChildren(node);
        domListNode.append(...renderedChildren.flat());
        return [domListNode];
    }
}
