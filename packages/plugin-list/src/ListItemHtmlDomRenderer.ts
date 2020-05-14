import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode } from './ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { List } from './List';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { ListItemAttributes } from './ListItemXmlDomParser';
import { VRange, withRange } from '../../core/src/VRange';

export class ListItemHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = List.isListItem;

    async render(node: VNode): Promise<Node[]> {
        const domListItem = document.createElement('li');

        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        this.engine.renderAttributes(ListItemAttributes, node, domListItem);

        if (node.is(ListNode)) {
            if (!domListItem.style.listStyle) {
                domListItem.style.listStyle = 'none';
            }
        } else if (ListNode.CHECKLIST(node.parent)) {
            domListItem.classList.add(ListNode.isChecked(node) ? 'checked' : 'unchecked');

            // Handle click in the checkbox.
            domListItem.addEventListener('mousedown', async (ev: MouseEvent) => {
                if (ev.offsetX < 0) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    withRange(VRange.at(node.firstChild()), async range => {
                        await this.engine.editor.execCommand('toggleChecked', {
                            context: {
                                range: range,
                            },
                        });
                    });
                }
            });
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
        return [domListItem];
    }
}
