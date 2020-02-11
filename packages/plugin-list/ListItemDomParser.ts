import { VNode } from '../core/src/VNodes/VNode';
import { isBlock } from '../utils/src/utils';
import { AbstractParser } from '../core/src/AbstractParser';

export class ListItemDomParser extends AbstractParser<Node> {
    static id = 'dom';

    predicate = (item: Node): boolean => {
        return item.nodeName === 'LI';
    };

    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    async parse(item: Node): Promise<VNode[]> {
        const children = Array.from(item.childNodes);
        // An empty text node as first child should be skipped.
        while (children.length && this._isEmptyTextNode(children[0])) {
            children.shift();
        }
        // A list item with no children should be skipped.
        if (!children.length) {
            return [];
        }
        const nodes: VNode[] = [];
        for (let k = 0; k < children.length; k++) {
            const domNode = children[k];
            const parsedChild = await this.engine.parse(domNode);
            if (this._isInlineListItem(domNode)) {
                // Inline elements in a list item should be wrapped in a base container.
                if (!this._isInlineListItem(domNode.previousSibling)) {
                    const baseContainer = this.engine.editor.createBaseContainer();
                    nodes.push(baseContainer);
                }
                nodes[nodes.length - 1].append(...parsedChild);
            } else {
                nodes.push(...(await this.engine.parse(domNode)));
            }
        }
        return nodes;
    }

    /**
     * Return true if the node is a text node containing only whitespace or nothing.
     *
     * @param item
     */
    _isEmptyTextNode(item: Node): boolean {
        return item.nodeType === Node.TEXT_NODE && /^\s*$/.test(item.textContent);
    }

    /**
     * Return true if the given node is an inline list item.
     *
     * @param item
     */
    _isInlineListItem(item: Node): boolean {
        return item && ((!isBlock(item) && !this._isEmptyTextNode(item)) || item.nodeName === 'BR');
    }
}
