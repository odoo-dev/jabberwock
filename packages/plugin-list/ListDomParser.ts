import { VNode } from '../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

const listTags = ['UL', 'OL'];

export class ListDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && listTags.includes(item.nodeName);
    };

    /**
     * Parse a list (UL, OL) and his children list elements (LI).
     *
     * @param context
     */
    async parse(item: Element): Promise<VNode[]> {
        if (!listTags.includes(item.nodeName)) {
            return;
        }
        const listType = item.nodeName === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
        const listNode = new ListNode(listType);
        const nodes = await this.engine.parse(...item.childNodes);
        listNode.append(...nodes);
        return [listNode];
    }
}
