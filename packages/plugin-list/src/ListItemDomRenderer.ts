import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { ListNode } from './ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { List } from './List';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { Direction } from '../../core/src/VSelection';
import { VSelectionParams } from '../../core/src/Core';
import { ChecklistNode } from './ChecklistNode';

export class ListItemDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = List.isListItem;

    async render(node: VNode): Promise<Node[]> {
        const domListItem = document.createElement('li');
        // Render the node's attributes that were stored on the technical key
        // that specifies those attributes belong on the list item.
        const liAttributes = node.attributes['li-attributes'];
        if (liAttributes && typeof liAttributes !== 'string') {
            this.engine.renderAttributes(liAttributes, domListItem);
        }

        if (node.is(ListNode)) {
            if (!domListItem.style.listStyle) {
                domListItem.style.listStyle = 'none';
            }
        } else if (node.parent.is(ChecklistNode)) {
            domListItem.classList.add(ChecklistNode.isChecked(node) ? 'checked' : 'unchecked');
            domListItem.addEventListener('mousedown', async (ev: MouseEvent) => {
                if (ev.offsetX < 0) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    const params: VSelectionParams = {
                        vSelection: {
                            anchorNode: node.firstChild(),
                            anchorPosition: RelativePosition.BEFORE,
                            focusNode: node.firstChild(),
                            focusPosition: RelativePosition.BEFORE,
                            direction: Direction.FORWARD,
                        },
                    };
                    await this.engine.editor.execCommand('setSelection', params);
                    await this.engine.editor.execCommand('toggleListCheck');
                }
            });
        }

        // Direct ListNode's VElement children "P" are rendered as "LI"
        // while other nodes will be rendered inside the "LI".
        if (node.is(VElement) && node.htmlTag === 'P') {
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
        return [domListItem];
    }
}
