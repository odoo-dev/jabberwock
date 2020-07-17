import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { ListDomObjectRenderer } from './ListDomObjectRenderer';
import { ListItemDomObjectRenderer } from './ListItemDomObjectRenderer';
import { ListXmlDomParser } from './ListXmlDomParser';
import { ListItemXmlDomParser, ListItemAttributes } from './ListItemXmlDomParser';
import { withRange, VRange } from '../../core/src/VRange';
import { IndentParams, OutdentParams } from '../../plugin-indent/src/Indent';
import { CheckingContext } from '../../core/src/ContextManager';
import { InsertParagraphBreakParams } from '../../core/src/Core';
import { DeleteBackwardParams } from '../../core/src/Core';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { distinct } from '../../utils/src/utils';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import {
    wrapNodeTemp,
    beforeNodeTemp,
    afterNodeTemp,
    testNodePredicate,
} from '../../core/src/VNodes/AbstractNode';
import {
    ancestorsNodesTemp,
    previousSiblingNodeTemp,
    nextSiblingNodeTemp,
} from '../../core/src/VNodes/AbstractNode';
import {
    replaceWith,
    isNodePredicate,
    closestNode,
    ancestorNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

export interface ListParams extends CommandParams {
    type: ListType;
}
export type toggleCheckedParams = CommandParams;

export class List<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static isListItem(node: VNode): boolean {
        return node.parent && isNodePredicate(node.parent, ListNode);
    }
    static isInList(type: ListType, node: VNode): boolean {
        return node && ancestorNodeTemp(node, ListNode)?.listType === type;
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
        toggleChecked: {
            title: 'Check or uncheck list items',
            selector: [ListNode.CHECKLIST],
            handler: this.toggleChecked,
        },
    };
    commandHooks = {
        // TODO: replace this with `onSiblingsChange` when we introduce events.
        deleteBackward: this.rejoin.bind(this),
        deleteForward: this.rejoin.bind(this),
    };
    readonly loadables: Loadables<Parser & Renderer & Keymap & Layout> = {
        parsers: [ListXmlDomParser, ListItemXmlDomParser],
        renderers: [ListItemDomObjectRenderer, ListDomObjectRenderer],
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
                pattern: 'CTRL+SHIFT+<Digit9>',
                commandId: 'toggleList',
                commandArgs: { type: ListType.CHECKLIST } as ListParams,
            },
            {
                pattern: 'CTRL+<Space>',
                commandId: 'toggleChecked',
            },
            {
                pattern: 'Backspace',
                selector: [List.isListItem],
                check: (context: CheckingContext): boolean => {
                    return !previousSiblingNodeTemp(context.range.start);
                },
                commandId: 'outdent',
            },
        ],
        components: [
            {
                id: 'OrderedListButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'ordered',
                        label: 'Toggle ordered list',
                        commandId: 'toggleList',
                        commandArgs: { type: ListType.ORDERED } as ListParams,
                        selected: (editor: JWEditor): boolean => {
                            const targetedNodes = editor.selection.range.targetedNodes();
                            return (
                                targetedNodes.length &&
                                targetedNodes.every(List.isInList.bind(List, ListType.ORDERED))
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa fa-list-ol fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'UnorderedListButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'unordered',
                        label: 'Toggle unordered list',
                        commandId: 'toggleList',
                        commandArgs: { type: ListType.UNORDERED } as ListParams,
                        selected: (editor: JWEditor): boolean => {
                            const targetedNodes = editor.selection.range.targetedNodes();
                            return (
                                targetedNodes.length &&
                                targetedNodes.every(List.isInList.bind(List, ListType.UNORDERED))
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa fa-list-ul fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'ChecklistButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'checkbox',
                        label: 'Toggle checkbox list',
                        commandId: 'toggleList',
                        commandArgs: { type: ListType.CHECKLIST } as ListParams,
                        selected: (editor: JWEditor): boolean => {
                            const targetedNodes = editor.selection.range.targetedNodes();
                            return (
                                targetedNodes.length &&
                                targetedNodes.every(List.isInList.bind(List, ListType.CHECKLIST))
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa far fa-check-square fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [
            ['OrderedListButton', ['actionables']],
            ['UnorderedListButton', ['actionables']],
            ['ChecklistButton', ['actionables']],
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
            const targetedNodes = range.targetedNodes();
            const ancestors = targetedNodes.map(node => closestNode(node, ListNode));
            const targetedLists = ancestors.filter(list => !!list);
            if (
                targetedLists.length === targetedNodes.length &&
                targetedLists.every(list => list.listType === type)
            ) {
                // Unlist the targeted nodes from all its list ancestors.
                while (ancestorNodeTemp(range.start, ListNode)) {
                    const nodesToUnlist = range.split(ListNode);
                    for (const list of nodesToUnlist) {
                        for (const child of list.childVNodes) {
                            // TODO: automatically invalidate `li-attributes`.
                            child.modifiers.remove(ListItemAttributes);
                        }
                        list.unwrap();
                    }
                }
            } else if (targetedLists.length === targetedNodes.length) {
                // If all nodes are in lists, convert the targeted list
                // nodes to the given list type.
                const lists = distinct(targetedLists);
                const listsToConvert = lists.filter(l => l.listType !== type);
                for (const list of listsToConvert) {
                    let newList = new ListNode({ listType: type });
                    replaceWith(list, newList);

                    // If the new list is after or before a list of the same
                    // type, merge them. Example:
                    // <ol><li>a</li></ol><ol><li>b</li></ol>
                    // => <ol><li>a</li><li>b</li></ol>).
                    const previousSibling = previousSiblingNodeTemp(newList);
                    if (previousSibling && isNodePredicate(previousSibling, ListNode[type])) {
                        newList.mergeWith(previousSibling);
                        newList = previousSibling;
                    }
                    const nextSibling = nextSiblingNodeTemp(newList);
                    if (nextSibling && isNodePredicate(nextSibling, ListNode[type])) {
                        nextSibling.mergeWith(newList);
                    }
                }
            } else {
                // If only some nodes are in lists and other aren't then only
                // wrap the ones that were not already in a list into a list of
                // the given type.
                let newList = new ListNode({ listType: type });
                const nodesToConvert = range.split(ListNode);
                for (const node of nodesToConvert) {
                    // Merge top-level lists instead of nesting them.
                    if (isNodePredicate(node, ListNode)) {
                        node.mergeWith(newList);
                    } else {
                        wrapNodeTemp(node, newList);
                    }
                }

                // If the new list is after or before a list of the same type,
                // merge them. Example:
                // <ol><li>a</li></ol><ol><li>b</li></ol>
                // => <ol><li>a</li><li>b</li></ol>).
                const previousSibling = previousSiblingNodeTemp(newList);
                if (previousSibling && isNodePredicate(previousSibling, ListNode[type])) {
                    newList.mergeWith(previousSibling);
                    newList = previousSibling;
                }

                const nextSibling = nextSiblingNodeTemp(newList);
                if (nextSibling && isNodePredicate(nextSibling, ListNode[type])) {
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
        const items = range.targetedNodes(
            (node: VNode) => node.parent && testNodePredicate(node.parent, ListNode),
        );

        // Do not indent items of a targeted nested list, since they
        // will automatically be indented with their list ancestor.
        const itemsToIndent = items.filter(item => {
            return !items.includes(ancestorNodeTemp(item, ListNode));
        });

        for (const item of itemsToIndent) {
            const prev = previousSiblingNodeTemp(item);
            const next = nextSiblingNodeTemp(item);
            // Indent the item by putting it into a pre-existing list sibling.
            if (prev && isNodePredicate(prev, ListNode)) {
                prev.append(item);
                // The two list siblings might be rejoinable now that the lower
                // level item breaking them into two different lists is no more.
                const listType = prev.listType;
                if (ListNode[listType](next) && !itemsToIndent.includes(next)) {
                    next.mergeWith(prev);
                }
            } else if (next && isNodePredicate(next, ListNode) && !itemsToIndent.includes(next)) {
                next.prepend(item);
            } else {
                // If no other candidate exists then wrap it in a new ListNode.
                const listType = ancestorNodeTemp(item, ListNode).listType;
                wrapNodeTemp(item, new ListNode({ listType: listType }));
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
        const items = range.targetedNodes(
            (node: VNode) => node.parent && isNodePredicate(node.parent, ListNode),
        );

        // Do not outdent items of a targeted nested list, since they
        // will automatically be outdented with their list ancestor.
        const itemsToOutdent = items.filter(item => {
            return !items.includes(ancestorNodeTemp(item, ListNode));
        });

        for (const item of itemsToOutdent) {
            const list = ancestorNodeTemp(item, ListNode);
            const previousSibling = previousSiblingNodeTemp(item);
            const nextSibling = nextSiblingNodeTemp(item);
            if (previousSibling && nextSibling) {
                const splitList = item.parent.splitAt(item);
                beforeNodeTemp(splitList, item);
            } else if (previousSibling) {
                afterNodeTemp(list, item);
            } else if (nextSibling) {
                beforeNodeTemp(list, item);
            } else {
                for (const child of list.childVNodes) {
                    // TODO: automatically invalidate `li-attributes`.
                    child.modifiers.remove(ListItemAttributes);
                }
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
        const listNode = ancestorNodeTemp(listItem, ListNode);
        if (listNode.children().length === 1) {
            listNode.unwrap();
        } else {
            afterNodeTemp(listNode, listItem);
        }
    }

    /**
     * Rejoin same type lists that are now direct siblings after the remove.
     *
     * @param params
     */
    rejoin(params: DeleteBackwardParams): void {
        const range = params.context.range;
        const listAncestors = ancestorsNodesTemp(range.start, ListNode);
        if (listAncestors.length) {
            let list: VNode = listAncestors[listAncestors.length - 1];
            let nextSibling = list && nextSiblingNodeTemp(list);
            while (
                list &&
                nextSibling &&
                isNodePredicate(list, ListNode) &&
                isNodePredicate(nextSibling, ListNode[list.listType])
            ) {
                const nextList = list.lastChild();
                const nextListSibling = nextSibling.firstChild();
                nextSibling.mergeWith(list);
                list = nextList;
                nextSibling = nextListSibling;
            }
        }
    }

    /**
     * Check or uncheck the list items at range.
     *
     * @param params
     */
    toggleChecked(params: toggleCheckedParams): void {
        const range = params.context.range;
        const items = range.targetedNodes(node => ListNode.CHECKLIST(node.parent));

        const areAllChecked = items.every(ListNode.isChecked);
        for (const item of items) {
            if (areAllChecked) {
                ListNode.uncheck(item);
            } else {
                ListNode.check(item);
            }
        }
    }
}
