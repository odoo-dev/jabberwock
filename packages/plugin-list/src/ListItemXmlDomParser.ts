import { VNode } from '../../core/src/VNodes/VNode';
import { isBlock } from '../../utils/src/isBlock';
import { nodeName } from '../../utils/src/utils';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';

export class ListItemXmlDomParser extends AbstractParser<Node> {
    static id = 'dom/xml';
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
        // A list item with no children should be skipped.
        if (!children.length) {
            return [];
        }
        const nodes: VNode[] = [];
        let inlinesContainer: VNode;
        // Parse the list item's attributes into a technical key of the node's
        // attributes, that will be read only by ListItemDomRenderer.
        const itemAttributes = { 'li-attributes': this.engine.parseAttributes(item) };
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
                        inlinesContainer.attributes = itemAttributes;
                        nodes.push(inlinesContainer);
                    }
                    inlinesContainer.append(...parsedChild);
                } else {
                    inlinesContainer = null; // Close the inlinesContainer.
                    for (const child of parsedChild) {
                        child.attributes = { ...child.attributes, ...itemAttributes };
                    }
                    nodes.push(...parsedChild);
                }
            }
        }
        // A list item with children but whose parsing returned nothing should
        // be parsed as an empty base container. Eg: <li><br/></li>: li has a
        // child so it will not return [] above (and therefore be ignored), but
        // br will parse to nothing because it's a placeholder br, not a real
        // line break. We cannot ignore that li because it does in fact exist so
        // we parse it as an empty base container.
        return nodes.length ? nodes : [new Container()];
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
