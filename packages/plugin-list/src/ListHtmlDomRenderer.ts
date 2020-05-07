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
        const attributes = node.modifiers.get(Attributes);
        if (attributes && attributes.constructor.name === 'Attributes') {
            this.engine.renderAttributes(attributes, domListNode);
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
