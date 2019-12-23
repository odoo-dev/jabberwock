import { utils } from './utils';

/**
 * Return a string with the value of a text node stripped of its formatting
 * space, applying the w3 rules for white space processing
 * TODO: decide what exactly to do with formatting spaces:
 * remove, keep, recompute?
 *
 * @see https://www.w3.org/TR/css-text-3/#white-space-processing
 * @returns {string}
 */
export function removeFormattingSpace(node: Node): string {
    // TODO: check the value of the `white-space` property
    const text: string = node.textContent;
    const spaceBeforeNewline = /([ \t])*(\n)/g;
    const spaceAfterNewline = /(\n)([ \t])*/g;
    const tabs = /\t/g;
    const newlines = /\n/g;
    const consecutiveSpace = /  */g;

    // (Comments refer to the w3 link provided above.)
    // Phase I: Collapsing and Transformation
    let newText = text
        // 1. All spaces and tabs immediately preceding or following a
        //    segment break are removed.
        .replace(spaceBeforeNewline, '$2')
        .replace(spaceAfterNewline, '$1')
        // 2. Segment breaks are transformed for rendering according to the
        //    segment break transformation rules.
        .replace(newlines, ' ')
        // 3. Every tab is converted to a space (U+0020).
        .replace(tabs, ' ')
        // 4. Any space immediately following another collapsible space —
        //    even one outside the boundary of the inline containing that
        //    space, provided both spaces are within the same inline
        //    formatting context—is collapsed to have zero advance width.
        //    (It is invisible, but retains its soft wrap opportunity, if
        //    any.)
        .replace(consecutiveSpace, ' ');

    // Phase II: Trimming and Positioning
    // 1. A sequence of collapsible spaces at the beginning of a line
    //    (ignoring any intervening inline box boundaries) is removed.
    if (_isAtSegmentBreak(node, 'start')) {
        const startSpace = /^ */g;
        newText = newText.replace(startSpace, '');
    }
    // 2. If the tab size is zero, tabs are not rendered. Otherwise, each
    //    tab is rendered as a horizontal shift that lines up the start edge
    //    of the next glyph with the next tab stop. If this distance is less
    //    than 0.5ch, then the subsequent tab stop is used instead. Tab
    //    stops occur at points that are multiples of the tab size from the
    //    block’s starting content edge. The tab size is given by the
    //    tab-size property.
    // TODO
    // 3. A sequence at the end of a line (ignoring any intervening inline
    //    box boundaries) of collapsible spaces (U+0020) and/or ideographic
    //    spaces (U+3000) whose white-space value collapses spaces is
    //    removed.
    if (_isAtSegmentBreak(node, 'end')) {
        const endSpace = /[ \u3000]*$/g;
        newText = newText.replace(endSpace, '');
    }
    return newText;
}
/**
 * Return true if the given node is immediately preceding (`side` === 'end')
 * or following (`side` === 'start') a segment break, to see if its edge
 * space must be removed.
 * A segment break is a sort of line break, not considering automatic breaks
 * that are function of the screen size. In this context, a segment is what
 * you see when you triple click in text in the browser.
 * Eg: `<div><p>◆one◆</p>◆two◆<br>◆three◆</div>` where ◆ = segment breaks.
 *
 * @param {Element} node
 * @param {'start'|'end'} side
 * @returns {boolean}
 */
function _isAtSegmentBreak(node: Node, side: 'start' | 'end'): boolean {
    const siblingSide = side === 'start' ? 'previousSibling' : 'nextSibling';
    const sibling = node && node[siblingSide];
    const isAgainstAnotherSegment = sibling && _isSegment(sibling);
    const isAtEdgeOfOwnSegment = _isBlockEdge(node, side);
    // In the DOM, a space before a BR is rendered but a space after a BR isn't.
    const isBeforeBR = side === 'end' && sibling && sibling.nodeName === 'BR';
    return (isAgainstAnotherSegment && !isBeforeBR) || isAtEdgeOfOwnSegment;
}
/**
 * Return true if the node is a segment according to W3 formatting model.
 *
 * @param node to check
 */
function _isSegment(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        // Only proper elements can be a segment.
        return false;
    } else if (node.nodeName === 'BR') {
        // Break (BR) tags end a segment.
        return true;
    } else {
        // The W3 specification has many specific cases that defines what is
        // or is not a segment. For the moment, we only handle display: block.
        return utils.isBlock(node);
    }
}
/**
 * Return true if the node is at the given edge of a block.
 *
 * @param node to check
 * @param side of the block to check ('start' or 'end')
 */
function _isBlockEdge(node: Node | Node, side: 'start' | 'end'): boolean {
    const ancestorsUpToBlock: Node[] = [];

    // Move up to the first block ancestor
    let ancestor = node;
    while (ancestor && (_isTextNode(ancestor) || !_isSegment(ancestor))) {
        ancestorsUpToBlock.push(ancestor);
        ancestor = ancestor.parentElement;
    }

    // Return true if no ancestor up to the first block ancestor has a
    // sibling on the specified side
    const siblingSide = side === 'start' ? 'previousSibling' : 'nextSibling';
    return ancestorsUpToBlock.every(ancestor => {
        return !ancestor[siblingSide];
    });
}
/**
 * Return true if the given node is a text node, false otherwise.
 *
 * @param node to check
 */
function _isTextNode(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE;
}
