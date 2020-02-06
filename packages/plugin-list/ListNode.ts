import { VNode } from '../core/src/VNodes/VNode';

export enum ListType {
    ORDERED = 'ordered',
    UNORDERED = 'unordered',
}

export class ListNode extends VNode {
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
        return new this.constructor<typeof ListNode>(this.listType);
    }
}
