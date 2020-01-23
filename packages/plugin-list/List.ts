import { JWPlugin } from '../core/src/JWPlugin';
import { ListNode } from './ListNode';
import { ParsingFunction } from '../core/src/Parser';

export class List extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [ListNode.parse];
}
