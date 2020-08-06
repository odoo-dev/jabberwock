import { VNode } from '../../core/src/VNodes/VNode';
import { isBlock } from '../../utils/src/isBlock';
import { nodeName } from '../../utils/src/utils';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Modifiers } from '../../core/src/Modifiers';

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
        for (let childIndex = 0; childIndex < children.length; childIndex++) {
            const domChild = children[childIndex];
            const parsedChild = await this.engine.parse(domChild);
            if (parsedChild.length) {
                if (this._isInlineListItem(domChild)) {
                    // Contiguous inline elements in a list item should be
                    // wrapped together in a base container.
                    if (!inlinesContainer) {
                        inlinesContainer = new Container();
                        inlinesContainer.modifiers.append(
                            new ListItemAttributes(itemModifiers.get(Attributes)),
                        );
                        nodes.push(inlinesContainer);
                    }
                    inlinesContainer.append(...parsedChild);
                } else {
                    if (inlinesContainer && !['UL', 'OL'].includes(nodeName(domChild))) {
                        inlinesContainer.append(...parsedChild);
                    } else {
                        inlinesContainer = null; // Close the inlinesContainer.
                        for (const child of parsedChild) {
                            child.modifiers.set(
                                new ListItemAttributes(itemModifiers.get(Attributes)),
                            );
                        }
                        nodes.push(...parsedChild);
                    }
                }
            }
        }
        // A list item with children but whose parsing returned nothing should
        // be parsed as an empty base container. Eg: <li><br/></li>: li has a
        // child so it will not return [] above (and therefore be ignored), but
        // br will parse to nothing because it's a placeholder br, not a real
        // line break. We cannot ignore that li because it does in fact exist so
        // we parse it as an empty base container.
        if (nodes.length) {
            return nodes;
        } else {
            const container = new Container();
            container.modifiers.append(new ListItemAttributes(itemModifiers.get(Attributes)));
            return [container];
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
