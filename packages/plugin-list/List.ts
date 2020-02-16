import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
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

        // Check if all targeted nodes are within a list of the same type.
        const areAllInMatchingList = range.targetedNodes().every(node => {
            const listAncestor = node.ancestor(ListNode);
            return listAncestor && listAncestor.listType === type;
        });

        // Dispatch.
        if (areAllInMatchingList) {
            // If all selected nodes are within a list of the same type,
            // "unlist" them.
            this._unlist(range);
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
    _unlist(range): void {
        withRange(VRange.clone(range), workingRange => {
            // Extend the range to cover the entirety of its containers.
            if (workingRange.startContainer.hasChildren()) {
                workingRange.setStart(workingRange.startContainer.firstChild());
            }
            if (workingRange.endContainer.hasChildren()) {
                workingRange.setEnd(workingRange.endContainer.lastChild());
            }

            const nodes = workingRange.split(ListNode);
            for (const list of nodes) {
                for (const nestedList of list.descendants(ListNode)) {
                    // TODO: automatically invalidate `li-attributes`.
                    for (const child of nestedList.children) {
                        delete child.attributes['li-attributes'];
                    }
                    nestedList.unwrap();
                }
                list.unwrap();
            }
        });
    }
}
