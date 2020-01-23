import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { CharNode, FormatType, FORMAT_TYPES } from '../../plugin-char/CharNode';
import { withMarkers } from '../../utils/src/markers';
import { FragmentNode } from './VNodes/FragmentNode';
import { VSelection } from './VSelection';
import { ListNode, ListType } from '../../plugin-list/ListNode';
import { utils } from '../../utils/src/utils';

export class VDocument {
    root: VNode;
    selection = new VSelection();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: FormatType = null;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(range = this.selection.range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.deleteSelection(range);
        }
        range.startContainer.splitAt(range.start);
    }
    /**
     * Insert something at range.
     *
     * @param node
     */
    insert(node: VNode, range = this.selection.range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.deleteSelection(range);
        }
        range.start.before(node);
    }
    /**
     * Insert text at the current position of the selection.
     *
     * If the selection is collapsed, add `text` to the vDocument and copy the
     * formating of the previous char or the next char.
     *
     * If the selection is not collapsed, replace the text with the formating
     * that was present in the selection.
     *
     * @param text
     */
    insertText(text: string, range = this.selection.range): void {
        const format = this._getCurrentFormat();
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.deleteSelection(range);
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, format);
            range.start.before(vNode);
        });
        this.formatCache = null;
    }

    /**
     * Get the format for the next insertion.
     */
    _getCurrentFormat(range = this.selection.range): FormatType {
        let format: FormatType = {};
        if (this.formatCache) {
            return this.formatCache;
        } else if (range.isCollapsed()) {
            const charToCopyFormat = range.start.previousSibling(CharNode) ||
                range.start.nextSibling(CharNode) || {
                    format: {},
                };
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = range.selectedNodes(CharNode);
            FORMAT_TYPES.forEach(formatName => {
                format[formatName] = selectedChars.some(char => char.format[formatName]);
            });
        }
        return format;
    }

    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(range: VRange): void {
        withMarkers(() => {
            const selectedNodes = range.selectedNodes();
            if (!selectedNodes.length) return;
            // If the node has children, merge it with the container of the
            // range. Children of the merged node that should be truncated
            // as well will be deleted in the following iterations since
            // they appear in `nodes`. The children array must be cloned in
            // order to modify it while iterating.
            const newContainer = range.start.parent;
            selectedNodes.forEach(vNode => {
                if (vNode.hasChildren()) {
                    vNode.mergeWith(newContainer);
                } else {
                    vNode.remove();
                }
            });
        });
    }

    //--------------------------------------------------------------------------
    // Context
    //--------------------------------------------------------------------------

    /**
     * Apply the `format` to the selection.
     *
     * If the selection is collapsed, set the format on the selection so we know
     * in the next insert which format should be used.
     */
    applyFormat(formatName: string, range = this.selection.range): void {
        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this._getCurrentFormat();
            }
            this.formatCache[formatName] = !this.formatCache[formatName];
        } else {
            const selectedChars = range.selectedNodes(CharNode);

            // If there is no char with the format `formatName` in the
            // selection, set the format to true for all nodes.
            if (!selectedChars.every(char => char.format[formatName])) {
                selectedChars.forEach(char => {
                    char[formatName] = true;
                });
                // If there is at least one char in with the format `fomatName`
                // in the selection, set the format to false for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char[formatName] = false;
                });
            }
        }
    }
    /**
     * Insert/remove a list at range.
     *
     * @param type
     */
    toggleList(type: ListType, range = this.selection.range): void {
        // Retrieve the nodes in the selection.
        let selectedNodes: Array<VNode>;
        if (range.isCollapsed()) {
            // Toggle the parent if the range is collapsed.
            selectedNodes = [range.start.parent];
        } else {
            selectedNodes = range.selectedNodes();
        }

        // Check if all selected nodes are within a list of the same type.
        const areAllInMatchingList = selectedNodes.every(node => {
            const listAncestor = this._listAncestor(node);
            return listAncestor && listAncestor.listType === type;
        });

        // Dispatch.
        if (areAllInMatchingList) {
            // If all selected nodes are within a list of the same type,
            // "unlist" them.
            this._unlist(selectedNodes);
        } else {
            this._convertToList(selectedNodes, type);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the first common ancestor of two nodes.
     *
     * @param a
     * @param b
     */
    _commonAncestor(a: VNode, b: VNode): VNode {
        const firstAncestors = a.ancestors();
        const lastAncestors = b.ancestors();
        return firstAncestors.find(ancestor => lastAncestors.includes(ancestor));
    }
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
        const lastListAncestor = this._listAncestor(last);
        if (lastListAncestor) {
            const duplicatedAncestors = this._splitUpToAncestor(last, lastListAncestor);
            duplicatedNodes = [...duplicatedNodes, ...duplicatedAncestors];
        }

        // If the first node is within a list, we need to split that list.
        // Then insert the new list to which the nodes will be appended.
        const first = nodes[0];
        const firstListAncestor = this._listAncestor(first);
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
            const commonAncestor = this._commonAncestor(first, last);
            const reference = first.ancestor(node => node.parent === commonAncestor) || first;
            commonAncestor.insertBefore(newList, reference);
        }

        // Move the nodes to the list
        withMarkers(() => {
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
        });

        // If the new list is after or before a list of the same type, merge
        // them (eg: <ol><li>a</li></ol><ol><li>b</li></ol> =>
        // <ol><li>a</li><li>b</li></ol>).
        const previousSibling = newList.previousSibling();
        if (previousSibling && previousSibling.is(ListNode) && previousSibling.listType === type) {
            newList.children.slice().forEach(child => previousSibling.append(child));
            newList.remove();
            newList = previousSibling as ListNode;
        }
        const nextSibling = newList.nextSibling();
        if (nextSibling && nextSibling.is(ListNode) && nextSibling.listType === type) {
            nextSibling.children.slice().forEach(child => newList.append(child));
            nextSibling.remove();
        }
    }
    /**
     * Return true if the given node is a nested `ListNode`, false otherwise.
     *
     * @param node
     */
    _isNestedList(node: VNode): node is ListNode {
        return node.is(ListNode) && !!this._listAncestor(node);
    }
    /**
     * Return a node's ancestor that is a `ListNode`, if any.
     *
     * @param node
     */
    _listAncestor(node: VNode): ListNode {
        return node.ancestor(ancestor => ancestor.is(ListNode)) as ListNode;
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
        const listItems = utils.distinct(
            nodes.map(node => {
                if (node.parent.is(ListNode)) {
                    return node;
                } else {
                    return node.ancestor(ancestor => {
                        return ancestor.parent.is(ListNode);
                    });
                }
            }),
        );

        // Split the lists and move their contents to move out of them.
        const lists = [];
        listItems.forEach(item => {
            lists.push(item.parent);
            const newList = item.parent.splitAt(item);
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
