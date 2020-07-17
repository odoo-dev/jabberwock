import { VNode } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Modifier } from '../../core/src/Modifier';
import {
    AbstractNodeParams,
    isNodePredicate,
    nextSiblingNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

export enum ListType {
    ORDERED = 'ORDERED',
    UNORDERED = 'UNORDERED',
    CHECKLIST = 'CHECKLIST',
}
export interface ListNodeParams extends AbstractNodeParams {
    listType: ListType;
}

export class IsChecked extends Modifier {}

export class ListNode extends ContainerNode {
    // Typescript currently doesn't support using enum as keys in interfaces.
    // Source: https://github.com/microsoft/TypeScript/issues/13042
    static ORDERED(node: VNode): node is ListNode {
        return node && isNodePredicate(node, ListNode) && node.listType === ListType.ORDERED;
    }
    static UNORDERED(node: VNode): node is ListNode {
        return node && isNodePredicate(node, ListNode) && node.listType === ListType.UNORDERED;
    }
    static CHECKLIST(node: VNode): node is ListNode {
        return node && isNodePredicate(node, ListNode) && node.listType === ListType.CHECKLIST;
    }
    listType: ListType;
    constructor(params: ListNodeParams) {
        super(params);
        this.listType = params.listType;
    }
    get name(): string {
        return super.name + ': ' + this.listType;
    }
    /**
     * Return true if the given node is a checked checklist or checklist item.
     *
     * @param node
     */
    static isChecked(node: VNode): boolean {
        if (ListNode.CHECKLIST(node) && node.hasChildren()) {
            // If the node is a populated checklist, it is checked in the case
            // that every one of its children is checked.
            return node.children().every(ListNode.isChecked);
        } else {
            const indentedChild = nextSiblingNodeTemp(node);
            if (ListNode.CHECKLIST(indentedChild)) {
                // If the next list item is a checklist, this list item is its
                // title, which is checked if said checklist's children are
                // checked.
                return ListNode.isChecked(indentedChild);
            } else {
                return !!node.modifiers.find(IsChecked);
            }
        }
    }
    /**
     * Set the given nodes as checked.
     *
     * @param nodes
     */
    static check(...nodes: VNode[]): void {
        for (const node of nodes) {
            if (isNodePredicate(node, ListNode)) {
                // Check the list's children.
                ListNode.check(...node.children());
            } else {
                // Check the node itself otherwise.
                node.modifiers.set(IsChecked);
                // Propagate to next indented list if any.
                const indentedChild = nextSiblingNodeTemp(node);
                if (indentedChild && isNodePredicate(indentedChild, ListNode)) {
                    ListNode.check(indentedChild);
                }
            }
        }
    }
    /**
     * Set the given nodes as unchecked.
     *
     * @param nodes
     */
    static uncheck(...nodes: VNode[]): void {
        for (const node of nodes) {
            if (isNodePredicate(node, ListNode)) {
                // Uncheck the list's children.
                ListNode.uncheck(...node.children());
            } else {
                // Uncheck the node.
                node.modifiers.remove(IsChecked);

                // Propagate to next indented list.
                const indentedChild = nextSiblingNodeTemp(node);
                if (indentedChild && isNodePredicate(indentedChild, ListNode)) {
                    ListNode.uncheck(indentedChild);
                }
            }
        }
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof ListNode>[0] = {
            listType: this.listType,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
