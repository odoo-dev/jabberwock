import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { ListNode, ListType } from './ListNode';

export class List extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [List.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        let listType: ListType;
        if (context.currentNode.nodeName === 'UL') {
            listType = ListType.UNORDERED;
        } else if (context.currentNode.nodeName === 'OL') {
            listType = ListType.ORDERED;
        }

        if (listType) {
            const listNode = new ListNode(listType);
            const parsingMap = new Map([[listNode, [context.currentNode]]]);
            return [context, parsingMap];
        }
    }
}
