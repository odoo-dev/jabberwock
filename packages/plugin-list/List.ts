import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap } from '../core/src/Parser';
import { ListNode, ListType } from './ListNode';
import { ParagraphNode } from '../plugin-paragraph/ParagraphNode';
import { utils } from '../utils/src/utils';
import { VNode } from '../core/src/VNodes/VNode';
import { withMarkers } from '../utils/src/markers';
import { RangeParams } from '../core/src/CorePlugin';
import { DomRenderingMap, DomRenderingContext } from '../plugin-dom/DomRenderer';
import { VElement } from '../core/src/VNodes/VElement';
import { VDocumentMap } from '../core/src/VDocumentMap';

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
    commands = {
        toggleList: {
            handler: this.toggleList.bind(this),
        },
    };
    static readonly parsingFunctions = [List.parse];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static readonly renderingFunctions = {
        dom: List.renderToDom,
    };
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (listTags.includes(context.currentNode.nodeName)) {
            return List.parseList({ ...context });
        } else if (context.currentNode.nodeName === 'LI') {
            return List.parseListItem({ ...context });
        }
    }
    /**
     * Parse a list (UL, OL).
     *
     * @param context
     */
    static parseList(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
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
    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    static parseListItem(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
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
        if (!utils.isBlock(children[0]) || children[0].nodeName === 'BR') {
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
    /**
     * Render the ListNode in currentContext.
     *
     * @param currentContext
     */
    static renderToDom(
        currentContext: DomRenderingContext,
    ): [DomRenderingContext, DomRenderingMap] {
        let context = { ...currentContext };
        const node = context.currentNode;
        const isUnrenderedListItem =
            node.parent && node.parent.is(ListNode) && !VDocumentMap.toDom(node);
        let result;
        if (isUnrenderedListItem) {
            result = List.renderListItemToDom({ ...context });
            context = result[0];
        }
        if (node.is(ListNode)) {
            result = List.renderListToDom({ ...context });
        }
        return result;
    }
    static renderListToDom(
        currentContext: DomRenderingContext,
    ): [DomRenderingContext, DomRenderingMap] {
        const list = currentContext.currentNode as ListNode;
        const tag = list.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        currentContext.parentNode.appendChild(domListNode);
        const renderingMap: DomRenderingMap = new Map([[domListNode, [list]]]);
        return [{ ...currentContext }, renderingMap];
    }
    static renderListItemToDom(
        currentContext: DomRenderingContext,
    ): [DomRenderingContext, DomRenderingMap] {
        // The ListNode has to handle the rendering of its direct children by
        // itself since some of them are rendered inside "LI" nodes while others
        // are rendered *as* "LI" nodes.
        const listItem = currentContext.currentNode;
        const domListNode = currentContext.parentNode;
        // Check if previous "LI" can be reused or create a new one.
        let liNode: Element;
        if (listItem.is(ListNode) && domListNode.childNodes.length) {
            // Render an indented list in the list item that precedes it.
            // eg.: <ul><li>title: <ul><li>indented</li></ul></ul>
            liNode = domListNode.childNodes[domListNode.childNodes.length - 1] as Element;
        } else {
            liNode = document.createElement('li');
        }
        domListNode.appendChild(liNode);

        const renderingMap: DomRenderingMap = new Map();
        currentContext.parentNode = liNode;
        // Direct ListNode's VElement children "P" are rendered as "LI"
        // while other nodes will be rendered inside the "LI".
        if (listItem.is(VElement) && listItem.htmlTag === 'P') {
            // Mark the "P" as rendered by the "LI".
            renderingMap.set(liNode, [listItem]);
            // TODO: this should be generic.
            if (!listItem.hasChildren()) {
                liNode.appendChild(document.createElement('BR'));
            }
        } else {
            return [{ ...currentContext }, undefined];
        }
        return [{ ...currentContext }, renderingMap];
    }

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
