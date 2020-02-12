import { LineBreakNode } from './LineBreakNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';
import { isBlock } from '../utils/src/utils';

export class LineBreakDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.nodeName === 'BR';
    };

    async parse(item: Element): Promise<LineBreakNode[]> {
        if (!this._nextLeafInSameBlock(item)) {
            // A <br/> at the end edge of a block is there only to make its
            // parent visible. Consume it since it was just parsed as its parent
            // element node. TODO: do this less naively to account for
            // formatting space.
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
     * Return the next leaf of the given node without crossing over blocks.
     *
     * @param item
     */
    _nextLeafInSameBlock(item: Node): Node {
        let next = item.nextSibling;
        if (!next) {
            return item.parentNode && this._nextLeafInSameBlock(item.parentNode);
        } else if (isBlock(next)) {
            return;
        } else {
            while (next.firstChild) {
                next = next.firstChild;
            }
            return next;
        }
    }
}
