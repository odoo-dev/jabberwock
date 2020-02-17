import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { VNode } from '../core/src/VNodes/VNode';
import { RangeParams } from '../core/src/CorePlugin';
import { ListDomRenderer } from './ListDomRenderer';
import { ListItemDomRenderer } from './ListItemDomRenderer';
import { ListDomParser } from './ListDomParser';
import { ListItemDomParser } from './ListItemDomParser';
import { withRange, VRange } from '../core/src/VRange';
import { IndentParams, OutdentParams } from '../plugin-indent/src/Indent';

export interface ListParams extends RangeParams {
    type: ListType;
}

export class List extends JWPlugin {
    static isListItem(node: VNode): boolean {
        return node.parent && node.parent.is(ListNode);
    }
    commands = {
        toggleList: {
            title: 'Toggle list',
            handler: this.toggleList.bind(this),
        },
        indent: {
            title: 'Indent list items',
            predicates: [ListNode],
            handler: this.indent.bind(this),
        },
        outdent: {
            title: 'Outdent list items',
            predicates: [ListNode],
            handler: this.outdent.bind(this),
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

        withRange(VRange.clone(range), range => {
            // Extend the range to cover the entirety of its containers.
            if (range.startContainer.hasChildren()) {
                range.setStart(range.startContainer.firstChild());
            }
            if (range.endContainer.hasChildren()) {
                range.setEnd(range.endContainer.lastChild());
            }

            const nodes = range.split(ListNode);

            // Check if all targeted nodes are within a list of the same type.
            const areAllInMatchingList = range.targetedNodes().every(node => {
                const listAncestor = node.ancestor(ListNode);
                return listAncestor && listAncestor.listType === type;
            });

            if (areAllInMatchingList) {
                // Unlist the targeted nodes.
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
            } else {
                // Convert the targeted nodes to the given list type.
                let newList = new ListNode(type);
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

                // If the new list is after or before a list of the same type,
                // merge them. Example:
                // <ol><li>a</li></ol><ol><li>b</li></ol>
                // => <ol><li>a</li><li>b</li></ol>).
                const previousSibling = newList.previousSibling();
                if (
                    previousSibling &&
                    previousSibling.is(ListNode) &&
                    previousSibling.listType === type
                ) {
                    newList.mergeWith(previousSibling);
                    newList = previousSibling;
                }

                const nextSibling = newList.nextSibling();
                if (nextSibling && nextSibling.is(ListNode) && nextSibling.listType === type) {
                    nextSibling.mergeWith(newList);
                }
            }
        });
    }

    /**
     * Indent one or more list items.
     *
     * @param params
     */
    indent(params: IndentParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const listItems = range.targetedNodes(node => node.parent && node.parent.is(ListNode));

        // Filter out non-identable list items.
        const itemsToIndent = listItems.filter(item => {
            const nodeIndex = item.parent.children().indexOf(item);
            if (nodeIndex === 0) {
                // Do not indent the first list item of a list.
                return false;
            } else if (nodeIndex === 1 && item.is(ListNode)) {
                // Do not indent the second item of a list if it is a nested
                // list following a non-list item.
                return item.previousSibling().is(ListNode);
            } else {
                // Do not indent items of a targeted nested list, since they
                // will automatically be indented with their list ancestor.
                return !listItems.includes(item.ancestor(ListNode));
            }
        });

        if (!itemsToIndent.length) return;

        // Extend indenting to the next nested list sibling of a non-list item.
        const lastItem = itemsToIndent[itemsToIndent.length - 1];
        if (!lastItem.is(ListNode)) {
            const nextSibling = lastItem.nextSibling();
            if (nextSibling && nextSibling.is(ListNode)) {
                itemsToIndent.push(nextSibling);
            }
        }

        for (const item of itemsToIndent) {
            const listType = item.ancestor(ListNode).listType;
            const prev = item.previousSibling();
            const next = item.nextSibling();
            // If possible, indent the item by putting it into a pre-existing
            // list sibling of the same type.
            if (prev && prev.is(ListNode) && prev.listType === listType) {
                prev.append(item);
            } else if (
                next &&
                next.is(ListNode) &&
                next.listType === listType &&
                !itemsToIndent.includes(next)
            ) {
                next.prepend(item);
            } else {
                // If no other candidate exists then wrap it in a new ListNode.
                item.wrap(new ListNode(listType));
            }
        }
    }

    /**
     * Outdent one or more list items.
     *
     * @param params
     */
    outdent(params: OutdentParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const listItems = range.targetedNodes(node => node.parent && node.parent.is(ListNode));

        // Do not outdent items of a targeted nested list, since they
        // will automatically be outdented with their list ancestor.
        const itemsToOutdent = listItems.filter(item => {
            return !listItems.includes(item.ancestor(ListNode));
        });

        if (!itemsToOutdent.length) return;

        // Extend outdenting to the next nested list sibling of a non-list item.
        const lastItem = itemsToOutdent[itemsToOutdent.length - 1];
        if (!lastItem.is(ListNode)) {
            const nextSibling = lastItem.nextSibling();
            if (nextSibling && nextSibling.is(ListNode)) {
                itemsToOutdent.push(nextSibling);
            }
        }

        for (const item of itemsToOutdent) {
            const list = item.ancestor(ListNode);
            const previousSibling = item.previousSibling();
            const nextSibling = item.nextSibling();
            if (previousSibling && nextSibling) {
                const splitList = item.parent.splitAt(item);
                splitList.before(item);
            } else if (previousSibling) {
                list.after(item);
            } else if (nextSibling) {
                list.before(item);
            } else {
                list.unwrap();
            }
        }
    }
}
