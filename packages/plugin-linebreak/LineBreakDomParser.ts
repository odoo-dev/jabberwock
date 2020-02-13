import { LineBreakNode } from './LineBreakNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';
import { isBlock } from '../utils/src/isBlock';

export class LineBreakDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.nodeName === 'BR';
    };

    async parse(item: Element): Promise<LineBreakNode[]> {
        if (this._isInvisibleBR(item)) {
            return [];
        }
        const lineBreak = new LineBreakNode();
        lineBreak.attributes = this.engine.parseAttributes(item);
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
        while (node && !node.nextSibling && node.parentNode && !isBlock(node.parentNode)) {
            node = node.parentNode;
        }
        return !node || !node.nextSibling || isBlock(node.nextSibling);
    }
}
