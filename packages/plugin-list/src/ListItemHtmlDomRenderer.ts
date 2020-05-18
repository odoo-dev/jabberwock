import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode } from './ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { List } from './List';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { ListItemAttributes } from './ListItemXmlDomParser';

export class ListItemHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = List.isListItem;

    async render(node: VNode): Promise<Node[]> {
        const domListItem = document.createElement('li');
        if (node.is(ListNode)) {
            if (!domListItem.style.listStyle) {
                domListItem.style.listStyle = 'none';
            }
        }

        // Direct ListNode's VElement children "P" are rendered as "LI"
        // while other nodes will be rendered inside the "LI".
        if (node.is(VElement) && node.htmlTag === 'P') {
            const renderedChildren = await this.renderChildren(node);
            domListItem.append(...renderedChildren.flat());
        } else {
            // The node was wrapped in a "LI" but needs to be rendered as well.
            const renderedNode = await this.super.render(node);
            domListItem.append(...renderedNode);
        }
        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        this.engine.renderAttributes(ListItemAttributes, node, domListItem);
        return [domListItem];
    }
}
