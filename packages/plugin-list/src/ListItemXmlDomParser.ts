import { VNode } from '../../core/src/VNodes/VNode';
import { isBlock } from '../../utils/src/isBlock';
import { nodeName } from '../../utils/src/utils';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { ListNode } from './ListNode';

export class ListItemAttributes extends Attributes {}

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
        let nodes: VNode[] = [];
        let inlinesContainer: VNode;
        // Parse the list item's attributes into the node's ListItemAttributes,
        // which will be read only by ListItemDomRenderer.
        const attributes = this.engine.parseAttributes(item);
        attributes.remove('value');

        const Container = this.engine.editor.configuration.defaults.Container;
        for (let childIndex = 0; childIndex < children.length; childIndex++) {
            const domChild = children[childIndex];
            const parsedChild = await this.engine.parse(domChild);
            if (parsedChild.length) {
                if (this._isInlineListItem(domChild)) {
                    // Contiguous inline elements in a list item should be
                    // wrapped together in a base container.
                    if (!inlinesContainer) {
                        inlinesContainer = new Container();
                        inlinesContainer.modifiers.append(new ListItemAttributes(attributes));
                        nodes.push(inlinesContainer);
                    }
                    inlinesContainer.append(...parsedChild);
                } else {
                    if (inlinesContainer && !['UL', 'OL'].includes(nodeName(domChild))) {
                        inlinesContainer.append(...parsedChild);
                    } else {
                        inlinesContainer = null; // Close the inlinesContainer.
                        for (const child of parsedChild) {
                            child.modifiers.append(new ListItemAttributes(attributes));
                        }
                        nodes.push(...parsedChild);
                    }
                }
            }
        }
        if (nodes.length === 0) {
            // A list item with children but whose parsing returned nothing should
            // be parsed as an empty base container. Eg: <li><br/></li>: li has a
            // child so it will not return [] above (and therefore be ignored), but
            // br will parse to nothing because it's a placeholder br, not a real
            // line break. We cannot ignore that li because it does in fact exist so
            // we parse it as an empty base container.
            const container = new Container();
            container.modifiers.append(new ListItemAttributes(attributes));
            container.append(...nodes);
            nodes = [container];
        } else if (nodes.filter(node => !(node instanceof ListNode)).length <= 1) {
            // A list item with all children are list except one (for the title),
            // are splitted into different list item to keep indent and outdent
            // feature.
            return nodes;
        } else if (nodes.length !== 1 || !(nodes[0] instanceof ContainerNode)) {
            // A list item with different children are grouped in a container.
            const container = new ContainerNode();
            container.modifiers.append(new ListItemAttributes(attributes));
            container.append(...nodes);
            nodes = [container];
        }

        return nodes;
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
