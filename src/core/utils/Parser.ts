import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { utils } from './utils';

export class Parser {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Parse a DOM fragment or its representation as a string.
     *
     * @param {Element} element the node to parse
     * @returns {VNode[]} the parsed node(s)
     */
    static parse(element: HTMLElement): VNode[] {
        let parsedNodes: VNode[] = [];
        const contents: NodeListOf<ChildNode> = element.childNodes;
        const children: Element[] = utils._collectionToArray(contents);
        children.forEach(child => {
            const parsedChildren: VNode[] = this._parseOne(child);
            if (parsedChildren.length) {
                parsedNodes = parsedNodes.concat(parsedChildren);
            }
        });
        return parsedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a DOM node and return its `VNodeType`.
     *
     * @param {Element} node
     * @returns {VNodeType}
     */
    static _getNodeType(node: Element): VNodeType {
        switch (node.tagName) {
            case 'P':
                return VNodeType.PARAGRAPH;
            case 'H1':
                return VNodeType.HEADING1;
            case 'H2':
                return VNodeType.HEADING2;
            case 'H3':
                return VNodeType.HEADING3;
            case 'H4':
                return VNodeType.HEADING4;
            case 'H5':
                return VNodeType.HEADING5;
            case 'H6':
                return VNodeType.HEADING6;
            case 'BR':
                return VNodeType.LINE_BREAK;
        }
    }
    /**
     * Return true if the given node is immediately preceding (`side` === 'end')
     * or following (`side` === 'start') a segment break, to see if its edge
     * space must be removed.
     *
     * @param {Element} node
     * @param {'start'|'end'} side
     * @returns {boolean}
     */
    static _isAgainstSegmentBreak(node: Element, side: 'start' | 'end'): boolean {
        const siblingSide = side === 'start' ? 'previousSibling' : 'nextSibling';
        let childOfBlockAncestor = node;
        while (
            childOfBlockAncestor &&
            childOfBlockAncestor.parentElement &&
            !this._isBlock(childOfBlockAncestor.parentElement as DOMElement)
        ) {
            childOfBlockAncestor = childOfBlockAncestor.parentElement;
        }
        let checkingNode = node;
        let isEdgeOfBlock = !!checkingNode;
        while (checkingNode && checkingNode !== childOfBlockAncestor) {
            if (checkingNode[siblingSide]) {
                isEdgeOfBlock = false;
                break;
            }
            checkingNode = checkingNode.parentElement;
        }
        const sibling = node && (node[siblingSide] as DOMElement);
        return (sibling && this._isBlock(sibling)) || isEdgeOfBlock;
    }
    /**
     * Return true if the node is a block.
     * Is considered a block, every node that is displayed as a block, and `BR`
     * elements.
     *
     * @param {DOMElement} node
     * @returns {boolean}
     */
    static _isBlock(node: DOMElement): boolean {
        const display = window.getComputedStyle(node, null).display;
        return display === 'block' || node.tagName === 'BR';
    }
    /**
     * Parse an (non-text, non-format) element.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseElement(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        const domMatch: DOMElement[] = [node as DOMElement];
        if (matchWith) {
            domMatch.push(matchWith as DOMElement);
        }
        const parsedNode: VNode = new VNode(this._getNodeType(node), domMatch, undefined, format);
        const children: Element[] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            const parsedChildren: VNode[] = this._parseOne(child);
            parsedChildren.forEach(parsedChild => {
                parsedNode.append(parsedChild);
            });
        });
        return [parsedNode];
    }
    /**
     * Parse a format element (i, b, u) by parsing its children, passing the format
     * to them as an attribute.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseFormatElement(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        format = {
            bold: (format && format.bold) || node.tagName === 'B',
            italic: (format && format.italic) || node.tagName === 'I',
            underlined: (format && format.underlined) || node.tagName === 'U',
        };
        let parsedChildren: VNode[] = [];
        const children: Element[] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            const parsedChild: VNode[] = this._parseOne(child, format, matchWith || node);
            parsedChildren = parsedChildren.concat(parsedChild);
        });
        return parsedChildren;
    }
    /**
     * Parse a DOM fragment or its representation as a string.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseOne(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        switch (node.tagName) {
            case undefined: // Text node
                return this._parseTextNode(node, format, matchWith);
            case 'B':
            case 'I':
            case 'U':
                return this._parseFormatElement(node, format, matchWith);
            default:
                return this._parseElement(node, format, matchWith);
        }
    }
    /**
     * Parse a text node.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseTextNode(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        const parsedNodes: VNode[] = [];
        const text: string = this._removeFormatSpace(node);
        for (let i = 0; i < text.length; i++) {
            const char: string = text.charAt(i);
            const domMatch: DOMElement[] = [node as DOMElement];
            if (matchWith) {
                domMatch.push(matchWith as DOMElement);
            }
            const parsedNode: VNode = new VNode(VNodeType.CHAR, domMatch, char, format);
            parsedNodes.push(parsedNode);
        }
        return parsedNodes;
    }
    /**
     * Return a string with the value of a text node stripped of its format space,
     * applying the w3 rules for white space processing
     *
     * @see https://www.w3.org/TR/css-text-3/#white-space-processing
     * @returns {string}
     */
    static _removeFormatSpace(node: Element): string {
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
        if (this._isAgainstSegmentBreak(node, 'start')) {
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
        if (this._isAgainstSegmentBreak(node, 'end')) {
            const endSpace = /[ \u3000]*$/g;
            newText = newText.replace(endSpace, '');
        }
        return newText;
    }
}
