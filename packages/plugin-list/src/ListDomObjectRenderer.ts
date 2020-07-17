import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ListNode, ListType } from './ListNode';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

import '../assets/checklist.css';
import { VNode } from '../../core/src/VNodes/VNode';
import { withRange, VRange } from '../../core/src/VRange';
import { ListItemAttributes } from './ListItemXmlDomParser';

export class ListDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ListNode;

    async render(listNode: ListNode): Promise<DomObject> {
        const list: DomObjectElement = {
            tag: listNode.listType === ListType.ORDERED ? 'OL' : 'UL',
            children: [],
        };
        if (ListNode.CHECKLIST(listNode)) {
            list.attributes = { class: new Set(['checklist']) };
        }
        const children = listNode.children();
        const domObjects = await this.engine.render(children);
        for (const index in children) {
            list.children.push(this._renderLi(listNode, children[index], domObjects[index]));
        }

        return list;
    }
    private _renderLi(
        listNode: ListNode,
        listItem: VNode,
        rendering: DomObject,
    ): DomObject | VNode {
        let li: DomObjectElement;
        // The node was wrapped in a "LI" but needs to be rendered as well.
        if ('tag' in rendering && rendering.tag === 'P' && !rendering.shadowRoot) {
            // Direct ListNode's VElement children "P" are rendered as "LI"
            // while other nodes will be rendered inside the "LI".
            li = rendering;
            li.tag = 'LI';
        } else if ('dom' in rendering && rendering.dom[0].nodeName === 'LI') {
            // If there is no child-specific renderer, the default renderer
            // is used. This takes the result of the Dom renderer which
            // itself wrap the children in LI.
            rendering.dom = [...rendering.dom[0].childNodes];
            li = {
                tag: 'LI',
                children: [rendering],
            };
        } else {
            li = {
                tag: 'LI',
                children: [listItem],
            };
        }

        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        this.engine.renderAttributes(ListItemAttributes, listItem, li);

        if (listNode.listType === ListType.ORDERED) {
            // Adapt numbering to skip previous list item
            // Source: https://stackoverflow.com/a/12860083
            const previousIdentedList = listItem.previousSibling();
            if (previousIdentedList instanceof ListNode) {
                const previousLis = previousIdentedList.previousSiblings(
                    sibling => !sibling.is(ListNode),
                );
                const value = Math.max(previousLis.length, 1) + 1;
                li.attributes.value = value.toString();
            }
        }

        if (listItem.is(ListNode)) {
            const style = li.attributes.style || {};
            if (!style['list-style']) {
                style['list-style'] = 'none';
            }
            li.attributes.style = style;
        } else if (ListNode.CHECKLIST(listItem.parent)) {
            const className = ListNode.isChecked(listItem) ? 'checked' : 'unchecked';
            if (li.attributes.class) {
                li.attributes.class.add(className);
            } else {
                li.attributes.class = new Set([className]);
            }

            // Handle click in the checkbox.
            const handlerMouseDown = (ev: MouseEvent): void => {
                if (ev.offsetX < 0) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    withRange(
                        this.engine.editor,
                        VRange.at(listItem.firstChild() || listItem),
                        range => {
                            return this.engine.editor.execCommand('toggleChecked', {
                                context: {
                                    range: range,
                                },
                            });
                        },
                    );
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
