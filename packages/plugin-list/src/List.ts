import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { ListDomRenderer } from './ListDomRenderer';
import { ListItemDomRenderer } from './ListItemDomRenderer';
import { ListDomParser } from './ListDomParser';
import { ListItemDomParser } from './ListItemDomParser';
import { withRange, VRange } from '../../core/src/VRange';
import { IndentParams, OutdentParams } from '../../plugin-indent/src/Indent';
import { CheckingContext } from '../../core/src/ContextManager';
import { InsertParagraphBreakParams } from '../../core/src/Core';
import { DeleteBackwardParams } from '../../core/src/Core';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Loadables } from '../../core/src/JWEditor';

export interface ListParams extends CommandParams {
    type: ListType;
}

export class List<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static isListItem(node: VNode): boolean {
        return node.parent && node.parent.is(ListNode);
    }
    static isInList(type: ListType, node: VNode): boolean {
        return node?.ancestor(ListNode)?.listType === type;
    }
    commands = {
        toggleList: {
            title: 'Toggle list',
            handler: this.toggleList,
        },
        indent: {
            title: 'Indent list items',
            selector: [ListNode],
            handler: this.indent,
        },
        outdent: {
            title: 'Outdent list items',
            selector: [ListNode],
            handler: this.outdent,
        },
        insertParagraphBreak: {
            selector: [ListNode, List.isListItem],
            check: (context: CheckingContext): boolean => {
                const [list, listItem] = context.selector;
                return !listItem.hasChildren() && listItem === list.lastChild();
            },
            handler: this.insertParagraphBreak,
        },
    };
    commandHooks = {
        // TODO: replace this with `onSiblingsChange` when we introduce events.
        deleteBackward: this.rejoin.bind(this),
        deleteForward: this.rejoin.bind(this),
    };
    readonly loadables: Loadables<Parser & Renderer & Keymap> = {
        parsers: [ListDomParser, ListItemDomParser],
        renderers: [ListItemDomRenderer, ListDomRenderer],
        shortcuts: [
            {
                pattern: 'CTRL+SHIFT+<Digit7>',
                commandId: 'toggleList',
                commandArgs: { type: ListType.ORDERED } as ListParams,
            },
            {
                pattern: 'CTRL+SHIFT+<Digit8>',
                commandId: 'toggleList',
                commandArgs: { type: ListType.UNORDERED } as ListParams,
            },
            {
                pattern: 'Backspace',
                selector: [List.isListItem],
                check: (context: CheckingContext): boolean => {
                    return !context.range.start.previousSibling();
                },
                commandId: 'outdent',
            },
        ],
    };

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
        const range = params.context.range;

        withRange(VRange.clone(range), range => {
            // Extend the range to cover the entirety of its containers.
            if (range.startContainer.hasChildren()) {
                range.setStart(range.startContainer.firstChild());
            }
            if (range.endContainer.hasChildren()) {
                range.setEnd(range.endContainer.lastChild());
            }

            // If all targeted nodes are within a list of given type then unlist
            // them. Otherwise, convert them to the given list type.
            if (range.targetedNodes().every(List.isInList.bind(List, type))) {
                // Unlist the targeted nodes.
                const nodesToUnlist = range.split(ListNode);
                for (const list of nodesToUnlist) {
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
                const nodesToConvert = range.split(ListNode);
                for (const node of nodesToConvert) {
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
                if (previousSibling && previousSibling.is(ListNode[type])) {
                    newList.mergeWith(previousSibling);
                    newList = previousSibling;
                }

                const nextSibling = newList.nextSibling();
                if (nextSibling && nextSibling.is(ListNode[type])) {
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
        const range = params.context.range;
        const items = range.targetedNodes(node => ListNode.test(node.parent));

        // Do not indent items of a targeted nested list, since they
        // will automatically be indented with their list ancestor.
        const itemsToIndent = items.filter(item => {
            return !items.includes(item.ancestor(ListNode));
        });

        if (!itemsToIndent.length) return;

        for (const item of itemsToIndent) {
            const prev = item.previousSibling();
            const next = item.nextSibling();
            // Indent the item by putting it into a pre-existing list sibling.
            if (prev && prev.is(ListNode)) {
                prev.append(item);
                // The two list siblings might be rejoinable now that the lower
                // level item breaking them into two different lists is no more.
                const listType = prev.listType;
                if (ListNode[listType](next) && !itemsToIndent.includes(next)) {
                    next.mergeWith(prev);
                }
            } else if (ListNode.test(next) && !itemsToIndent.includes(next)) {
                next.prepend(item);
            } else {
                // If no other candidate exists then wrap it in a new ListNode.
                const listType = item.ancestor(ListNode).listType;
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
        const range = params.context.range;
        const items = range.targetedNodes(node => ListNode.test(node.parent));

        // Do not outdent items of a targeted nested list, since they
        // will automatically be outdented with their list ancestor.
        const itemsToOutdent = items.filter(item => {
            return !items.includes(item.ancestor(ListNode));
        });

        if (!itemsToOutdent.length) return;

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

    /**
     * Insert a paragraph break in the last empty item of a list by unwrapping
     * the list item from the list, thus becoming the new paragraph.
     *
     * @param params
     */
    insertParagraphBreak(params: InsertParagraphBreakParams): void {
        const range = params.context.range;
        const listItem = range.startContainer;
        const listNode = listItem.ancestor(ListNode);
        if (listNode.children().length === 1) {
            listNode.unwrap();
        } else {
            listNode.after(listItem);
        }
    }

    /**
     * Rejoin same type lists that are now direct siblings after the remove.
     *
     * @param params
     */
    rejoin(params: DeleteBackwardParams): void {
        const range = params.context.range;
        const listAncestors = range.start.ancestors(ListNode);
        if (listAncestors.length) {
            let list: VNode = listAncestors[listAncestors.length - 1];
            let nextSibling = list && list.nextSibling();
            while (
                list &&
                nextSibling &&
                list.is(ListNode) &&
                nextSibling.is(ListNode[list.listType])
            ) {
                const nextList = list.lastChild();
                const nextListSibling = nextSibling.firstChild();
                nextSibling.mergeWith(list);
                list = nextList;
                nextSibling = nextListSibling;
            }
        }
    }
}
