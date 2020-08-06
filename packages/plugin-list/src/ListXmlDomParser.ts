import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { ListItemAttributes } from './ListItemXmlDomParser';

const listTags = ['UL', 'OL'];

export class ListXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && listTags.includes(nodeName(item));
    };

    /**
     * Parse a list (UL, OL) and its children list elements (LI).
     *
     * @param context
     */
    async parse(item: Element): Promise<VNode[]> {
        // Get the list's type (ORDERED, UNORDERED, CHECKLIST).
        let type: ListType;
        if (item.className.match(/(^| )checklist( |$)/i)) {
            type = ListType.CHECKLIST;
        } else {
            type = nodeName(item) === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
        }

        // Create the list node and parse its children and attributes.
        const list = new ListNode({ listType: type });
        const attributes = this.engine.parseAttributes(item);
        if (type === ListType.CHECKLIST) {
            attributes.classList.remove('checklist');
        }
        if (attributes.length) {
            list.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        list.append(...children);

        // In the case of a checklist, parse their checked/unchecked status and
        // ensure vertical propagation.
        if (type === ListType.CHECKLIST) {
            for (const child of children) {
                const liAttributes = child.modifiers.find(ListItemAttributes);
                if (liAttributes) {
                    // Parse the list item's checked status.
                    if (liAttributes.classList.has('checked')) {
                        ListNode.check(child);
                    }

                    // Remove the checklist-related classes from `liAttributes`.
                    liAttributes.classList.remove('checklist checked unchecked');
                }
            }
        }
        return [list];
    }
}
