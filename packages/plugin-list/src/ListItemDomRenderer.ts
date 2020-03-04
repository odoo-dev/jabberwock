import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode } from './ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { List } from './List';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

export class ListItemDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
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
            if (!node.hasChildren()) {
                const br = document.createElement('BR');
                domListItem.appendChild(br);
            }
            const renderedChildren = await this.renderChildren(node);
            for (const renderedChild of renderedChildren) {
                for (const domChild of renderedChild) {
                    domListItem.appendChild(domChild);
                }
            }
        } else {
            // The node was wrapped in a "LI" but needs to be rendered as well.
            const renderedNode = await this.super.render(node);
            for (const domNode of renderedNode) {
                domListItem.appendChild(domNode);
            }
        }
        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        const liAttributes = node.attributes['li-attributes'];
        if (liAttributes && typeof liAttributes !== 'string') {
            this.engine.renderAttributes(liAttributes, domListItem);
        }
        return [domListItem];
    }
}
