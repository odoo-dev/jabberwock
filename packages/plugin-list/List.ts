import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { distinct } from '../utils/src/utils';
import { VNode } from '../core/src/VNodes/VNode';
import { RangeParams } from '../core/src/CorePlugin';
import { ListDomRenderer } from './ListDomRenderer';
import { ListItemDomRenderer } from './ListItemDomRenderer';
import { ListDomParser } from './ListDomParser';
import { ListItemDomParser } from './ListItemDomParser';
import { VRange } from '../core/src/VRange';

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
        const selectedNodes = List.getNodesToToggle(range);

        // Dispatch.
        if (List.areInListType(selectedNodes, type)) {
            // If all selected nodes are within a list of the same type,
            // "unlist" them.
            this._unlist(selectedNodes);
        } else {
            this._convertToList(selectedNodes, type);
        }
    }
    /**
     * Check if all given nodes are within a list of the given type.
     */
    static areInListType(nodes: VNode[], type: ListType): boolean {
        return nodes.every(node => {
            const listAncestor = node.ancestor(ListNode);
            return listAncestor && listAncestor.listType === type;
        });
    }
    /**
     * Return a list of nodes to toggle a list on: the selected nodes of the
     * given range or the range's parent element if said range is collapsed.
     *
     * @param range
     */
    static getNodesToToggle(range: VRange): VNode[] {
        // Retrieve the nodes in the selection.
        let selectedNodes: Array<VNode>;
        if (range.isCollapsed()) {
            // Toggle the parent if the range is collapsed.
            selectedNodes = [range.start.parent];
        } else {
            selectedNodes = range.selectedNodes();
        }
        return selectedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Convert the given nodes to a list with the given `htmlTag`.
     *
     * @param nodes
     * @param type
     */
    _convertToList(nodes: Array<VNode>, type: ListType): void {
        let newList = new ListNode(type);
        let duplicatedNodes = [];

        // Lists cannot have atomic nodes as direct children.
        nodes = Array.from(new Set(nodes.map(node => (node.atomic ? node.parent : node))));

        // If the last node is within a list, we need to split that list.
        const last = nodes[nodes.length - 1];
        const lastListAncestor = last.ancestor(ListNode);
        if (lastListAncestor) {
            const duplicatedAncestors = this._splitUpToAncestor(last, lastListAncestor);
            duplicatedNodes = [...duplicatedNodes, ...duplicatedAncestors];
        }

        // If the first node is within a list, we need to split that list.
        // Then insert the new list to which the nodes will be appended.
        const first = nodes[0];
        const firstListAncestor = first.ancestor(ListNode);
        if (firstListAncestor) {
            const duplicatedAncestors = this._splitUpToAncestor(first, firstListAncestor);
            duplicatedNodes = [...duplicatedNodes, ...duplicatedAncestors];

            // Insert the new list before the first node's list ancestor.
            // It was split so we need its duplicate as that is where the node is.
            const newListAncestor = duplicatedAncestors[duplicatedAncestors.length - 1];
            newListAncestor.before(newList);
        } else {
            // Insert the new list before the common ancestor to the first and
            // last nodes.
            const commonAncestor = first.commonAncestor(last);
            const reference = first.ancestor(node => node.parent === commonAncestor) || first;
            commonAncestor.insertBefore(newList, reference);
        }

        // Move the nodes to the list
        // Remove the children of nested lists (they will be moved together
        // with their parent) and convert nested lists to the new type.
        const nestedLists = nodes.filter(this._isNestedList.bind(this));
        const nonNestedNodes = nodes.filter(node => {
            return !node.ancestor(ancestor => nestedLists.includes(ancestor));
        });
        nestedLists.forEach(nestedList => ((nestedList as ListNode).listType = type));
        // Move the nodes.
        nonNestedNodes.forEach(node => {
            newList.append(node);
        });
        // Remove empty lists.
        duplicatedNodes.concat(nodes).forEach(node => {
            if (node.is(ListNode) && !node.hasChildren()) {
                node.remove();
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
     * Return true if the given node is a nested `ListNode`, false otherwise.
     *
     * @param node
     */
    _isNestedList(node: VNode): node is ListNode {
        return node.is(ListNode) && !!node.ancestor(ListNode);
    }
    /**
     * Split a node and its ancestors up until the given ancestor.
     *
     * @param node
     * @returns a list of the duplicated nodes generated during the splits.
     */
    _splitUpToAncestor(node: VNode, ancestor: VNode): VNode[] {
        const duplicatedNodes = [];
        let child = node;
        let parent = child.parent;
        do {
            duplicatedNodes.push(parent.splitAt(child));
            child = parent;
            parent = child.parent;
        } while (child !== ancestor);
        if (!ancestor.hasChildren()) {
            ancestor.remove();
        }
        return duplicatedNodes;
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
