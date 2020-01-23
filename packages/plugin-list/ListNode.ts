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
    static parse(node: Node): ListNode[] {
        let listType: ListType;
        if (node.nodeName === 'UL') {
            listType = ListType.UNORDERED;
        } else if (node.nodeName === 'OL') {
            listType = ListType.ORDERED;
        }

        if (listType) {
            return [new ListNode(listType)];
        }
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
    shallowDuplicate(): ListNode {
        return new ListNode(this.listType);
    }

    /**
     * Merge this node with the given VNode.
     * List nodes only merge their first item into the given container.
     *
     * @param newContainer The new container for this node's first item
     */
    mergeWith(newContainer: VNode): void {
        if (this.hasChildren()) {
            const firstItem = this.firstChild();
            firstItem.children.slice().forEach(child => {
                newContainer.append(child);
            });
            firstItem.remove();
        }
        // Remove the list if it is now empty after removal of its first item.
        if (!this.hasChildren()) {
            this.remove();
        }
    }
}
