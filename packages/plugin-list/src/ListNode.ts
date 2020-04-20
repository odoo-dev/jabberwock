import { VNode } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { ChecklistNode } from './ChecklistNode';

export enum ListType {
    ORDERED = 'ORDERED',
    UNORDERED = 'UNORDERED',
    CHECKLIST = 'CHECKLIST',
}

export class ListNode extends ContainerNode {
    // Typescript currently doesn't support using enum as keys in interfaces.
    // Source: https://github.com/microsoft/TypeScript/issues/13042
    static ORDERED(node: VNode): node is ListNode {
        return node && node.is(ListNode) && node.listType === ListType.ORDERED;
    }
    static UNORDERED(node: VNode): node is ListNode {
        return node && node.is(ListNode) && node.listType === ListType.UNORDERED;
    }
    static CHECKLIST(node: VNode): node is ChecklistNode {
        return node && node.is(ListNode) && node.listType === ListType.CHECKLIST;
    }
    listType: ListType;
    constructor(listType: ListType) {
        super();
        this.listType = listType;
    }
    get name(): string {
        return super.name + ': ' + this.listType;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(): this {
        const clone = new this.constructor<typeof ListNode>(this.listType);
        clone.attributes = { ...this.attributes };
        return clone;
    }
}
