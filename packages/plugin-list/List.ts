import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { distinct } from '../utils/src/utils';
import { VNode } from '../core/src/VNodes/VNode';
import { RangeParams } from '../core/src/CorePlugin';
import { ListDomRenderer } from './ListDomRenderer';
import { ListItemDomRenderer } from './ListItemDomRenderer';
import { ListDomParser } from './ListDomParser';
import { ListItemDomParser } from './ListItemDomParser';
import { withRange, VRange } from '../core/src/VRange';

export interface ListParams extends RangeParams {
    type: ListType;
}

export class List extends JWPlugin {
    static isListItem(node: VNode): boolean {
        return node.parent && node.parent.is(ListNode);
    }
    commands = {
        toggleList: {
            handler: this.toggleList.bind(this),
        },
    };
    shortcuts = [
        {
            pattern: 'CTRL+SHIFT+<Digit7>',
            commandId: 'toggleList',
            commandArgs: { type: 'ordered' } as ListParams,
        },
        {
            pattern: 'CTRL+SHIFT+<Digit8>',
            commandId: 'toggleList',
            commandArgs: { type: 'unordered' } as ListParams,
        },
    ];
    readonly parsers = [ListDomParser, ListItemDomParser];
    readonly renderers = [ListItemDomRenderer, ListDomRenderer];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert/remove a list at range.
     *
     * @param params
     */
    toggleList(params: ListParams): void {
        const type = params.type;
        const range = params.range || this.editor.vDocument.selection.range;

        // Retrieve the nodes targeted by the range.
        const targetedNodes = range.targetedNodes();

        // Check if all targeted nodes are within a list of the same type.
        const areAllInMatchingList = targetedNodes.every(node => {
            const listAncestor = node.ancestor(ListNode);
            return listAncestor && listAncestor.listType === type;
        });

        // Dispatch.
        if (areAllInMatchingList) {
            // If all selected nodes are within a list of the same type,
            // "unlist" them.
            this._unlist(targetedNodes);
        } else {
            this._convertToList(range, type);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Convert the given nodes to a list with the given `htmlTag`.
     *
     * @param range
     * @param type
     */
    _convertToList(range, type: ListType): void {
        let newList = new ListNode(type);
        withRange(VRange.clone(range), workingRange => {
            // Extend the range to cover the entirety of its containers.
            if (workingRange.startContainer.hasChildren()) {
                workingRange.setStart(workingRange.startContainer.firstChild());
            }
            if (workingRange.endContainer.hasChildren()) {
                workingRange.setEnd(workingRange.endContainer.lastChild());
            }

            const nodes = workingRange.split(ListNode);
            for (const node of nodes) {
                // Convert nested lists into the new type.
                for (const nestedList of node.descendants(ListNode)) {
                    const newNestedList = new ListNode(type);
                    nestedList.before(newNestedList);
                    nestedList.mergeWith(newNestedList);
                }

                node.wrap(newList);
                // Merge top-level lists instead of nesting them.
                if (node.is(ListNode)) {
                    node.mergeWith(newList);
                }
            }
        });

        // If the new list is after or before a list of the same type, merge
        // them (eg: <ol><li>a</li></ol><ol><li>b</li></ol> =>
        // <ol><li>a</li><li>b</li></ol>).
        const previousSibling = newList.previousSibling();
        if (previousSibling && previousSibling.is(ListNode) && previousSibling.listType === type) {
            newList.mergeWith(previousSibling);
            newList = previousSibling;
        }
        const nextSibling = newList.nextSibling();
        if (nextSibling && nextSibling.is(ListNode) && nextSibling.listType === type) {
            nextSibling.mergeWith(newList);
        }
    }
    /**
     * Turn list elements into non-list elements.
     *
     * @param nodes
     */
    _unlist(nodes: Array<VNode>): void {
        // Get the direct children of each list to unlist.
        const listItems = distinct(
            nodes.map(node => {
                if (node.parent && node.parent.is(ListNode)) {
                    return node;
                } else {
                    return node.ancestor(ancestor => {
                        return ancestor.parent && ancestor.parent.is(ListNode);
                    });
                }
            }),
        );

        // Split the lists and move their contents to move out of them.
        const lists = [];
        listItems.forEach(item => {
            lists.push(item.parent);
            const newList = item.parent.splitAt(item);
            delete item.attributes['li-attributes'];
            newList.before(item);
            lists.push(newList);
        });

        // Remove empty lists.
        lists.forEach(list => {
            if (!list.hasChildren()) {
                list.remove();
            }
        });
    }
}
