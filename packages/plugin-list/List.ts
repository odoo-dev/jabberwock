import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap } from '../core/src/Parser';
import { ListNode, ListType } from './ListNode';
import { ParagraphNode } from '../plugin-paragraph/ParagraphNode';
import { isBlock, distinct } from '../utils/src/utils';
import { VNode } from '../core/src/VNodes/VNode';
import { RangeParams } from '../core/src/CorePlugin';
import { ListDomRenderer } from './ListDomRenderer';
import { ListItemDomRenderer } from './ListItemDomRenderer';
import { VRange } from '../core/src/VRange';
import { IndentParams, OutdentParams } from '../plugin-indent/src/Indent';

export interface ListParams extends RangeParams {
    type: ListType;
}

const listTags = ['UL', 'OL'];
const listContextTags = listTags.concat('LI');
/**
 * Return true if the node is a text node containing only whitespace or nothing.
 *
 * @param node
 */
function _isEmptyTextNode(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE && /^\s*$/.test(node.textContent);
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
            title: 'Indent list',
            predicates: [ListNode],
            handler: this.indent.bind(this),
        },
        outdent: {
            title: 'Outdent list',
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
    readonly parsingFunctions = [this.parseList.bind(this), this.parseListItem.bind(this)];
    readonly renderers = [ListDomRenderer, ListItemDomRenderer];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Parse a list (UL, OL).
     *
     * @param context
     */
    parseList(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
        if (listTags.includes(currentContext.currentNode.nodeName)) {
            const domNode = currentContext.currentNode;
            const parentNode = domNode.parentNode;
            const parentName = parentNode && parentNode.nodeName;
            const parentVNode = currentContext.parentVNode;
            if (listContextTags.includes(parentName) && !parentVNode.is(ListNode)) {
                // We're about to parse an indented list. In our abstraction, an
                // indented list is a direct child of its parent list, regardless
                // of what was already in its <li> parent. So the following example:
                // <ul><li>abc<ul><li>def</li></ul></li></ul>
                // when parsed in our abstraction is equivalent to:
                // <ul><li>abc</li><li><ul><li>def</li></ul></li></ul>
                // Both will eventually be rendered as the former.
                // Set the parent to be the list node rather than the list item.
                currentContext.parentVNode = parentVNode.ancestor(ListNode);
            }
            const listType = domNode.nodeName === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
            const listNode = new ListNode(listType);
            const parsingMap = new Map([[listNode, [currentContext.currentNode]]]);
            currentContext.parentVNode.append(listNode);
            return [currentContext, parsingMap];
        }
    }
    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    parseListItem(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
        if (currentContext.currentNode.nodeName === 'LI') {
            const context = { ...currentContext };
            const children = Array.from(context.currentNode.childNodes);
            const parsingMap: ParsingMap = new Map();
            // An empty text node as first child should be skipped.
            while (children.length && _isEmptyTextNode(children[0])) {
                children.shift();
            }
            // A list item with no children should be skipped.
            if (!children.length) {
                return [context, parsingMap];
            }
            // Inline elements in a list item should be wrapped in a paragraph.
            if (!isBlock(children[0]) || children[0].nodeName === 'BR') {
                const paragraph = new ParagraphNode(); // todo: remove reference to plugin
                context.parentVNode.append(paragraph);
                context.parentVNode = paragraph;
                parsingMap.set(paragraph, [context.currentNode]);
            }
            // Now we can move on to the list item's contents, to be added to
            // the paragraph created above, or to the list itself in the case of
            // blocks.
            return [context, parsingMap];
        }
    }
    /**
     * Insert/remove a list at range.
     *
     * @param params
     */
    toggleList(params: ListParams): void {
        const type = params.type;
        const range = params.range || this.editor.vDocument.selection.range;

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
            const listAncestor = node.ancestor(ListNode);
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

    /**
     * Indent one or more list items.
     *
     * @param params
     */
    indent(params: IndentParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const firstListNode = this._getFirstListNode(range.start);
        const parents = range.start.ancestors();
        const directChildOfListNode = parents[parents.indexOf(firstListNode) - 1];

        if (directChildOfListNode.parent.firstChild() === directChildOfListNode) {
            return;
        }

        const parentListNode = this._getSelectedListItemsNodes(range);

        for (const selectedListItems of parentListNode) {
            // const selectedListItems = selectedNodes.filter(node => node.parent === parent);
            const parent = selectedListItems[0].parent as ListNode;

            if (selectedListItems.length > 0) {
                let toAddNode: ListNode;
                const previousSibling = selectedListItems[0].previousSibling();
                if (previousSibling instanceof ListNode) {
                    toAddNode = previousSibling;
                } else {
                    toAddNode = new ListNode(parent.listType);
                    selectedListItems[0].before(toAddNode);
                }
                const nextSibling = selectedListItems[selectedListItems.length - 1].nextSibling();
                if (nextSibling instanceof ListNode) {
                    selectedListItems.push(nextSibling);
                }
                selectedListItems.forEach(toAddNode.append.bind(toAddNode));
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
        const firstListNode = this._getFirstListNode(range.start);
        const parentListNode = this._getSelectedListItemsNodes(range);

        for (const selectedListItems of parentListNode) {
            const parent = selectedListItems[0].parent as ListNode;
            const lastNode = selectedListItems[selectedListItems.length - 1];

            if (selectedListItems.length > 0) {
                const otherNodes = parent.children.slice(parent.children.indexOf(lastNode) + 1);

                // if the nextSibling of a lastNode is a ListNode, we need to move it
                const nextSibling = lastNode.nextSibling();
                if (nextSibling instanceof ListNode) {
                    otherNodes.shift();
                    otherNodes.unshift(...nextSibling.children);
                    nextSibling.remove();
                }
                if (otherNodes.length > 0) {
                    const newListNode = new ListNode(firstListNode.listType);
                    otherNodes.forEach(newListNode.append.bind(newListNode));
                    parent.after(newListNode);
                }

                selectedListItems
                    .slice()
                    .reverse()
                    .forEach(parent.after.bind(parent));
                if (parent.children.length === 0) {
                    parent.remove();
                }
            }
        }
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

    /**
     * Get the first list node in ancestors.
     *
     * @param node
     */
    _getFirstListNode(node: VNode): ListNode | undefined {
        return node.ancestors().find(node => node instanceof ListNode) as ListNode;
    }

    /**
     * Get a list of selected items.
     *
     * Example of vDocument written in pseudo code:
     * ```
     * UL
     *   P "a"
     *   UL
     *     P "b[c"
     *     P "d"
     * UL
     *   P "e"
     *   P "f"
     * UL
     *   P "g]h"
     * ```
     * Note: The range start is symbolized with "[" and the range end is symbolized with "]".
     *
     * This selection will return
     * [
     *   [P that contain "bc", P that contain "d"]
     *   [P that contain "e", P that contain "f"],
     *   [P that contain "gh"],
     * ]
     *
     * @param range
     */
    _getSelectedListItemsNodes(range: VRange): VNode[][] {
        const firstListNode = this._getFirstListNode(range.start);

        const parents = range.start.ancestors();
        const directChildOfListNode = parents[parents.indexOf(firstListNode) - 1];

        const selectedNodes = range.selectedNodes();
        selectedNodes.unshift(directChildOfListNode);

        const commonAncestor = range.end.commonAncestor(range.start);
        const indexAncestor = range.end.ancestors().indexOf(commonAncestor);
        const ancestorParents = range.end.ancestors().slice(0, indexAncestor);
        ancestorParents.forEach(selectedNodes.push.bind(selectedNodes));

        const parentListNode = new Set<ListNode>();
        const selectedChildOfList = selectedNodes.filter(node => node.parent instanceof ListNode);
        // the first element is not included in the selection.
        selectedChildOfList.unshift(directChildOfListNode);
        for (const child of selectedChildOfList) {
            if (!child.ancestors().find(parent => parentListNode.has(parent as ListNode))) {
                parentListNode.add(child.parent as ListNode);
            }
        }

        return [...parentListNode].map(parent =>
            selectedNodes.filter(node => node.parent === parent),
        );
    }
}
