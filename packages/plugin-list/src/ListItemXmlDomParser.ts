import { VNode } from '../../core/src/VNodes/VNode';
import { isBlock } from '../../utils/src/isBlock';
import { nodeName } from '../../utils/src/utils';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Modifiers } from '../../core/src/Modifiers';
import { ListNode } from './ListNode';
import { DividerNode } from '../../plugin-divider/src/DividerNode';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { HeadingNode } from '../../plugin-heading/src/HeadingNode';
import { PreNode } from '../../plugin-pre/src/PreNode';

export class ListItemAttributes extends Attributes {}

const SUB_LISTS_TAGS = ['OL', 'UL'];

export class ListItemXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'LI';
    };

    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    async parse(item: Element): Promise<VNode[]> {
        const children = Array.from(item.childNodes);
        const nodes: VNode[] = [];
        let inlinesContainer: VNode;
        // Parse the list item's attributes into the node's ListItemAttributes,
        // which will be read only by ListItemDomRenderer.
        const itemModifiers = new Modifiers();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            itemModifiers.append(attributes);
        }
        const Container = this.engine.editor.configuration.defaults.Container;
        const isInline = children.map(child => this._isInlineListItem(child));
        // Wrap inline nodes if the LI only contains inline nodes or sublists.
        const allInline = isInline.every(isChildInline => isChildInline);
        const hasSubList = children.some(child => SUB_LISTS_TAGS.includes(nodeName(child)));
        // Having a sublist will trigger a split of the content of the li to
        // allow multi indentation, so in this case a wrap is required.
        const wrapInlines = allInline || hasSubList;
        for (let childIndex = 0; childIndex < children.length; childIndex++) {
            const domChild = children[childIndex];
            const parsedChild = await this.engine.parse(domChild);
            if (parsedChild.length) {
                if (isInline[childIndex] && wrapInlines) {
                    // Contiguous inline elements in a list item should be
                    // wrapped together in a base container.
                    if (!inlinesContainer) {
                        inlinesContainer = new Container();
                        const attributes = itemModifiers.get(Attributes);
                        attributes.remove('value');
                        inlinesContainer.modifiers.append(new ListItemAttributes(attributes));
                        nodes.push(inlinesContainer);
                    }
                    inlinesContainer.append(...parsedChild);
                } else {
                    if (inlinesContainer && !SUB_LISTS_TAGS.includes(nodeName(domChild))) {
                        inlinesContainer.append(...parsedChild);
                    } else {
                        inlinesContainer = null; // Close the inlinesContainer.
                        if (!isInline[childIndex]) {
                            for (const child of parsedChild) {
                                const attributes = itemModifiers.get(Attributes);
                                attributes.remove('value');
                                child.modifiers.set(new ListItemAttributes(attributes));
                            }
                        }
                        nodes.push(...parsedChild);
                    }
                }
            }
        }

        if (nodes.length === 0) {
            // A list item with children but whose parsing returned nothing
            // should be parsed as an empty base container. Eg: <li><br/></li>:
            // li has a child so it will not return [] above (and therefore be
            // ignored), but br will parse to nothing because it's a placeholder
            // br, not a real line break. We cannot ignore that li because it
            // does in fact exist so we parse it as an empty base container.
            const container = new Container();
            container.modifiers.append(new ListItemAttributes(itemModifiers.get(Attributes)));
            container.append(...nodes);
            return [container];
        } else if (
            (nodes.length === 1 &&
                // TODO: we need some sort of PhrasingContainer class for this.
                (nodes[0] instanceof ParagraphNode ||
                    nodes[0] instanceof HeadingNode ||
                    nodes[0] instanceof PreNode)) ||
            nodes.filter(node => node instanceof ListNode).length > 0
        ) {
            // Having a sub-list is also a special case where the sub lits gets
            // its own list item rather than wrapping in a container.
            // TODO: We should not remove the P we actually parsed it as is.
            return nodes;
        } else {
            // A list item with different container children is represented by
            // a DividerNode.
            // TODO: we need a default FlowContainer constructor.
            const divider = new DividerNode();
            divider.modifiers.append(new ListItemAttributes(attributes));
            divider.append(...nodes);
            return [divider];
        }
    }

    /**
     * Return true if the given node is an inline list item.
     *
     * @param item
     */
    _isInlineListItem(item: Node): boolean {
        return item && (!isBlock(item) || nodeName(item) === 'BR');
    }
}
