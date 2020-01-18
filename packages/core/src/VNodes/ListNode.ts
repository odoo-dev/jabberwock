import { VElement } from './VElement';

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
}
