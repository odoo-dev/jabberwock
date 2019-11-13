import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';
import { Format } from './Format';
import { VDocumentMap } from './VDocumentMap';
import { LineBreakNode } from '../stores/VNodes/LineBreakNode';
import { CharNode } from '../stores/VNodes/CharNode';
import { SimpleElementNode } from '../stores/VNodes/SimpleElementNode';

interface ParsingContext {
    readonly rootNode?: Node;
    node?: Node;
    parentVNode?: VNode;
    format?: FormatType[];
}

/**
 * Parse the given DOM Node into VNode(s).
 *
 * @param node to parse
 * @param [format] to apply to the parsed node (default: none)
 * @returns the parsed VNode(s)
 */
function parseNode(currentContext: ParsingContext): ParsingContext {
    switch (currentContext.node.nodeType) {
        case Node.ELEMENT_NODE: {
            return parseElementNode(currentContext);
        }
        case Node.TEXT_NODE: {
            return parseTextNode(currentContext);
        }
        case Node.DOCUMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE: {
            // These nodes have no effect in the context of parsing, but the
            // parsing itself will continue with their children.
            return currentContext;
        }
        case Node.CDATA_SECTION_NODE:
        case Node.PROCESSING_INSTRUCTION_NODE:
        case Node.COMMENT_NODE:
        case Node.DOCUMENT_TYPE_NODE:
        default: {
            throw `Unsupported node type: ${currentContext.node.nodeType}.`;
        }
    }
}

/**
 * Create and return a `VNode` corresponding to the given DOM tag.
 *
 * TODO: When introducing videos and other complex (atomic) nodes, this is going
 * to be to naive and it will have to be replaced.
 *
 * @param node
 */
function VNodeFromTag(tag: string): VNode {
    switch (tag) {
        case 'P':
            return new SimpleElementNode(VNodeType.PARAGRAPH, tag);
        case 'H1':
            return new SimpleElementNode(VNodeType.HEADING1, tag);
        case 'H2':
            return new SimpleElementNode(VNodeType.HEADING2, tag);
        case 'H3':
            return new SimpleElementNode(VNodeType.HEADING3, tag);
        case 'H4':
            return new SimpleElementNode(VNodeType.HEADING4, tag);
        case 'H5':
            return new SimpleElementNode(VNodeType.HEADING5, tag);
        case 'H6':
            return new SimpleElementNode(VNodeType.HEADING6, tag);
        case 'BR':
            return new LineBreakNode();
    }
}
/**
 * Parse the given DOM Element into VNode(s).
 *
 * @param node to parse
 * @param [format] to apply to the parsed node (default: none)
 * @returns the parsed VNode(s)
 */
function parseElementNode(currentContext: ParsingContext): ParsingContext {
    const context = { ...currentContext };

    const node = context.node;
    if (Format.tags.includes(context.node.nodeName)) {
        // Format nodes (e.g. B, I, U) are parsed differently than regular
        // elements since they are not represented by a proper VNode in our
        // internal representation but by the format of its children.
        // For the parsing, encountering a format node generates a new format
        // context which inherits from the previous one.
        const format = context.format.length ? context.format[0] : {};
        context.format.unshift({
            bold: format.bold || node.nodeName === 'B',
            italic: format.italic || node.nodeName === 'I',
            underlined: format.underlined || node.nodeName === 'U',
        });
    } else {
        const parsedNode: VNode = VNodeFromTag(node.nodeName);
        Object.assign(parsedNode.format, context.format[0]);
        VDocumentMap.set(parsedNode, node);
        context.parentVNode.append(parsedNode);
    }
    return context;
}
/**
 * Parse the given text node into VNode(s).
 *
 * @param node to parse
 * @param [format] to apply to the parsed node (default: none)
 * @returns the parsed VNode(s)
 */
function parseTextNode(currentContext: ParsingContext): ParsingContext {
    const node = currentContext.node;
    const parentVNode = currentContext.parentVNode;
    const format = currentContext.format[0];
    const text = _removeFormatSpace(node);
    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        const parsedVNode = new CharNode(char, format);
        VDocumentMap.set(parsedVNode, node, i);
        parentVNode.append(parsedVNode);
    }
    return currentContext;
}

function nextParsingContext(currentContext: ParsingContext): ParsingContext {
    const nextContext = { ...currentContext };

    const node = currentContext.node;
    if (node.childNodes.length) {
        // Parse the first child with the current node as parent, if any.
        nextContext.node = node.childNodes[0];
        // Text node cannot have children, therefore `node` is an Element, not
        // a text node. Only text nodes can be represented by multiple VNodes,
        // so the first matching VNode can safely be selected from the map.
        // If `node` as no VNode representation  in the map (e.g. format nodes),
        // its children are added into the current `parentVNode`.
        const parsedParent = VDocumentMap.fromDom(node);
        if (parsedParent) {
            nextContext.parentVNode = parsedParent[0];
        }
    } else if (node.nextSibling) {
        // Parse the siblings of the current node with the same parent, if any.
        nextContext.node = node.nextSibling;
    } else {
        // Parse the next ancestor sibling in the ancestor tree, if any.
        let ancestor = node;
        // Climb back the ancestor tree to the first parent having a sibling.
        const rootNode = currentContext.rootNode;
        do {
            ancestor = ancestor.parentNode;
            if (ancestor && Format.tags.includes(ancestor.nodeName)) {
                // Pop last formatting context from the stack
                nextContext.format.shift();
            }
        } while (ancestor && !ancestor.nextSibling && ancestor !== rootNode);
        // At this point, the found ancestor has a sibling.
        if (ancestor && ancestor !== rootNode) {
            // Text node cannot have children, therefore parent is an Element,
            // not a text node. Only text nodes can be represented by multiple
            // VNodes so the first VNode can safely be selected from the map.
            nextContext.node = ancestor.nextSibling;
            nextContext.parentVNode = VDocumentMap.fromDom(ancestor.parentNode)[0];
        } else {
            // If no ancestor having a sibling could be found then the tree has
            // been fully parsed. There is no next parsing context. Stop it.
            return;
        }
    }
    return nextContext;
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
    return isAgainstAnotherSegment || isAtEdgeOfOwnSegment;
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
        const temporaryElement = document.createElement(node.nodeName);
        document.body.appendChild(temporaryElement);
        const display = window.getComputedStyle(temporaryElement).display;
        document.body.removeChild(temporaryElement);
        return display.includes('block');
    }
}
/**
 * Return true if the node is at the given edge of a block.
 *
 * @param node to check
 * @param side of the block to check ('start' or 'end')
 */
function _isBlockEdge(node: Node | Node, side: 'start' | 'end'): boolean {
    const ancestorsUpToBlock = [];

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
/**
 * Return a string with the value of a text node stripped of its formatting
 * space, applying the w3 rules for white space processing
 * TODO: decide what exactly to do with formatting spaces:
 * remove, keep, recompute?
 *
 * @see https://www.w3.org/TR/css-text-3/#white-space-processing
 * @returns {string}
 */
function _removeFormatSpace(node: Node): string {
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

export const Parser = {
    /**
     * Parse an HTML element into the editor's virtual representation.
     *
     * @param node the HTML element to parse
     * @returns the element parsed into the editor's virtual representation
     */
    parse: (node: Node): VDocument => {
        const root = new VNode(VNodeType.ROOT);
        VDocumentMap.set(root, node);
        // The tree is parsed in depth-first order traversal.
        // Start with the first child and the whole tree will be parsed.
        if (node.childNodes.length) {
            let context: ParsingContext = {
                rootNode: node,
                node: node.childNodes[0],
                parentVNode: root,
                format: [],
            };
            do {
                context = parseNode(context);
            } while ((context = nextParsingContext(context)));
        }
        return new VDocument(root);
    },
};
