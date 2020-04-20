import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { ChecklistNode } from './ChecklistNode';

const listTags = ['UL', 'OL'];

export class ListDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && listTags.includes(item.tagName);
    };

    /**
     * Parse a list (UL, OL) and his children list elements (LI).
     *
     * @param context
     */
    async parse(item: Element): Promise<VNode[]> {
        const nodes = await this.engine.parse(...item.childNodes);
        let listNode: ListNode;
        if ((item.getAttribute('class') || '').match(/(^| )checklist( |$)/i)) {
            const checklist = new ChecklistNode();
            checklist.append(...nodes);
            for (const node of nodes) {
                const listAttributes = node.attributes['li-attributes'] as Record<string, string>;
                if (listAttributes?.class) {
                    if (listAttributes.class.match(/(^| )checked( |$)/i)) {
                        const next = node.nextSibling();
                        if (!next || !next.is(ChecklistNode)) {
                            // don't apply check on children, the child are already check/uncheck an propagate information
                            checklist.check(node);
                        }
                    }
                    listAttributes.class = listAttributes.class
                        .replace(/(^| )(checklist|(un)?checked)( |$)/gi, ' ')
                        .trim();
                    if (!listAttributes.class) {
                        delete listAttributes.class;
                    }
                }
            }
            listNode = checklist;
        } else {
            const listType = item.tagName === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
            listNode = new ListNode(listType);
            listNode.append(...nodes);
        }
        listNode.attributes = this.engine.parseAttributes(item);
        return [listNode];
    }
}
