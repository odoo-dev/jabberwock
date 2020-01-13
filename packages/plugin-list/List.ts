import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode, ListType } from './ListNode';
import { ParsingFunction } from '../core/src/Parser';

export class List extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [List.parse];
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
}
