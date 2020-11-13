import { LineBreakNode } from './LineBreakNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { isBlock } from '../../utils/src/isBlock';
import { nodeName, isInstanceOf } from '../../utils/src/utils';
import { removeFormattingSpace } from '../../utils/src/formattingSpace';

export class LineBreakXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return (
            (item instanceof Element && nodeName(item) === 'BR') ||
            (item instanceof Text &&
                item.textContent === '\u200B' &&
                !item.nextSibling &&
                (!item.previousSibling || nodeName(item.previousSibling) === 'BR'))
        );
    };

    async parse(item: Element): Promise<LineBreakNode[]> {
        if (this._isInvisibleBR(item)) {
            return [];
        }
        const lineBreak = new LineBreakNode();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            lineBreak.modifiers.append(attributes);
        }
        return [lineBreak];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given <br/> node is invisible. A <br/> at the end edge
     * of a block or before another block is there only to make its parent
     * visible. Consume it since it was just parsed as its parent element node.
     * TODO: account for formatting space.
     *
     * @param node
     */
    _isInvisibleBR(node: Node): boolean {
        // Search for another non-block cousin in the same block parent.
        while (
            node &&
            !this._nextVisibleSibling(node) &&
            node.parentNode &&
            !isBlock(node.parentNode)
        ) {
            node = node.parentNode;
        }
        const nextVisibleSibling = this._nextVisibleSibling(node);
        return !node || !nextVisibleSibling || isBlock(nextVisibleSibling);
    }
    /**
     * Return the given node's next sibling that is not pure formatting space.
     *
     * @param node
     */
    _nextVisibleSibling(node: Node): Node {
        let sibling = node.nextSibling;
        while (sibling && isInstanceOf(sibling, Text) && !removeFormattingSpace(sibling).length) {
            sibling = sibling.nextSibling;
        }
        return sibling;
    }
}
