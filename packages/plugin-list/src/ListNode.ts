import { VNode } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export enum ListType {
    ORDERED = 'ORDERED',
    UNORDERED = 'UNORDERED',
}

export class ListNode extends ContainerNode {
    // Typescript currently doesn't support using enum as keys in interfaces.
    // Source: https://github.com/microsoft/TypeScript/issues/13042
    static ORDERED(node: VNode): node is ListNode {
        return node && node.is(ListNode) && node.listType === ListType.ORDERED;
    }
    static UNORDERED(node: VNode): node is ListNode {
        return node && node.is(ListNode) && node.listType == ListType.UNORDERED;
    }
    listType: ListType;
    constructor(params: { listType: ListType }) {
        super();
        this.listType = params.listType;
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
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof ListNode>[0] = {
            listType: this.listType,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
