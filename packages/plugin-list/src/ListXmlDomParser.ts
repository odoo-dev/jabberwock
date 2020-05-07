import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

const listTags = ['UL', 'OL'];

export class ListXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && listTags.includes(nodeName(item));
    };

    /**
     * Parse a list (UL, OL) and his children list elements (LI).
     *
     * @param context
     */
    async parse(item: Element): Promise<VNode[]> {
        if (!listTags.includes(nodeName(item))) return;
        const listType = nodeName(item) === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
        const listNode = new ListNode({ listType });
        listNode.modifiers.append(this.engine.parseAttributes(item));
        const nodes = await this.engine.parse(...item.childNodes);
        listNode.append(...nodes);
        return [listNode];
    }
}
