import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { List } from './List';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { ListItemAttributes } from './ListItemXmlDomParser';
import { withRange, VRange } from '../../core/src/VRange';

export class ListItemDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = List.isListItem;

    async render(node: VNode): Promise<DomObject> {
        const li: DomObject = {
            tag: 'LI',
            children: [],
            attributes: {},
        };
        // Direct ListNode's VElement children "P" are rendered as "LI"
        // while other nodes will be rendered inside the "LI".
        if (node.is(VElement) && node.htmlTag === 'P') {
            const renderedChildren = await this.engine.renderChildren(node);
            li.children.push(...renderedChildren);
        } else {
            // The node was wrapped in a "LI" but needs to be rendered as well.
            const renderedNode = await this.super.render(node);
            if ('dom' in renderedNode && renderedNode.dom[0].nodeName === 'LI') {
                // If there is no child-specific renderer, the default renderer
                // is used. This takes the result of the Dom renderer which
                // itself wrap the children in LI.
                renderedNode.dom = [...renderedNode.dom[0].childNodes];
            }
            li.children.push(renderedNode);
        }
        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        this.engine.renderAttributes(ListItemAttributes, node, li);

        if (node.ancestor(ListNode)?.listType === ListType.ORDERED) {
            // Adapt numbering to skip previous list item
            // Source: https://stackoverflow.com/a/12860083
            const previousIdentedList = node.previousSibling();
            if (previousIdentedList instanceof ListNode) {
                const previousLis = previousIdentedList.previousSiblings(
                    sibling => !sibling.is(ListNode),
                );
                const value = Math.max(previousLis.length, 1) + 1;
                li.attributes.value = value.toString();
            }
        }

        if (node.is(ListNode)) {
            let style = li.attributes.style || '';
            if (style.indexOf('list-style') === -1) {
                style += 'list-style: none;';
            }
            li.attributes.style = style;
        } else if (ListNode.CHECKLIST(node.parent)) {
            const className = ListNode.isChecked(node) ? 'checked' : 'unchecked';
            if (li.attributes.class) {
                li.attributes.class += ' ' + className;
            } else {
                li.attributes.class = className;
            }

            // Handle click in the checkbox.
            const handlerMouseDown = (ev: MouseEvent): void => {
                if (ev.offsetX < 0) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    withRange(VRange.at(node.firstChild() || node), range => {
                        return this.engine.editor.execCommand('toggleChecked', {
                            context: {
                                range: range,
                            },
                        });
                    });
                }
            };
            li.attach = (el: HTMLElement): void => {
                el.addEventListener('mousedown', handlerMouseDown);
            };
            li.detach = (el: HTMLElement): void => {
                el.removeEventListener('mousedown', handlerMouseDown);
            };
        }
        return li;
    }
}
