import { VElement } from './VElement';
import { VNode } from './VNode';

export enum ListType {
    ORDERED = 'ordered',
    UNORDERED = 'unordered',
}
const typeToTag = new Map<ListType, string>([[ListType.ORDERED, 'OL'], [ListType.UNORDERED, 'UL']]);
const tagToType = new Map<string, ListType>(
    Array.from(typeToTag.keys()).map(type => [typeToTag.get(type), type]),
);

export class ListNode extends VElement {
    listType: ListType;
    constructor(listType: ListType) {
        super(typeToTag.get(listType));
        this.listType = listType;
    }
    static parse(node: Node): ListNode[] {
        const listType = tagToType.get(node.nodeName);
        if (listType) {
            return [new ListNode(listType)];
        }
    }
    get htmlTag(): string {
        return typeToTag.get(this.listType);
    }
    set htmlTag(tag: string) {
        const type = tagToType.get(tag);
        if (!type) {
            throw new Error(
                `Cannot set a ListNode's htmlTag property to "${tag}" ListNodes correspond strictly to "OL" and "UL" elements.`,
            );
        } else {
            this.listType = type;
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
