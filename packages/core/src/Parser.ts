import { VDocument } from './VDocument';
import { Format } from '../../utils/src/Format';
import { VDocumentMap } from './VDocumentMap';
import { VRangeDescription } from './VRange';
import { Direction, RelativePosition } from '../../utils/src/range';
import { VNode, VNodeType } from './VNode';
import { DomRangeDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { CharNode, FormatType } from './VNodes/CharNode';
import { SimpleElementNode } from './VNodes/SimpleElementNode';
import { LineBreakNode } from './VNodes/LineBreakNode';
import { RootNode } from './VNodes/RootNode';

interface ParsingContext {
    readonly rootNode?: Node;
    node?: Node;
    parentVNode?: VNode;
    format?: FormatType[];
    vDocument: VDocument;
}

export class Parser {
    /**
     * Parse an HTML element into the editor's virtual representation.
     *
     * @param node the HTML element to parse
     * @returns the element parsed into the editor's virtual representation
     */
    parse(node: Node): VDocument {
        const root = new RootNode();
        VDocumentMap.set(root, node);
        const vDocument = new VDocument(root);
        // The tree is parsed in depth-first order traversal.
        // Start with the first child and the whole tree will be parsed.
        if (node.childNodes.length) {
            let context: ParsingContext = {
                rootNode: node,
                node: node.childNodes[0],
                parentVNode: root,
                format: [],
                vDocument: vDocument,
            };
            do {
                context = this.parseNode(context);
            } while (context);
        }

        // Parse the DOM range if any.
        const selection = node.ownerDocument.getSelection();
        const range = selection.rangeCount && selection.getRangeAt(0);
        if (range && node.contains(range.startContainer) && node.contains(range.endContainer)) {
            const forward = range.startContainer === selection.anchorNode;
            const vRange = this.parseRange(range, forward ? Direction.FORWARD : Direction.BACKWARD);
            vDocument.range.set(vRange);
        }

        // Set a default range in VDocument if none was set yet.
        if (!vDocument.range.start.parent || !vDocument.range.end.parent) {
            vDocument.range.setAt(vDocument.root);
        }

        return vDocument;
    }
    /**
     * Parse a node depending on its DOM type.
     *
     * @param currentContext The current context
     * @returns The next parsing context
     */
    parseNode(currentContext: ParsingContext): ParsingContext {
        let context;
        switch (currentContext.node.nodeType) {
            case Node.ELEMENT_NODE: {
                context = this.parseElementNode(currentContext);
                break;
            }
            case Node.TEXT_NODE: {
                context = this.parseTextNode(currentContext);
                break;
            }
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE: {
                // These nodes have no effect in the context of parsing, but the
                // parsing itself will continue with their children.
                context = currentContext;
                break;
            }
            case Node.CDATA_SECTION_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            default: {
                throw `Unsupported node type: ${currentContext.node.nodeType}.`;
            }
        }
        return this.nextParsingContext(context);
    }
    /**
     * Convert the DOM description of a range to the description of a VRange.
     *
     * @param range
     * @param [direction]
     */
    parseRange(range: DomRangeDescription): VRangeDescription;
    parseRange(range: Range, direction: Direction): VRangeDescription;
    parseRange(range: Range | DomRangeDescription, direction?: Direction): VRangeDescription {
        const start = this._locate(range.startContainer, range.startOffset);
        const end = this._locate(range.endContainer, range.endOffset);
        if (start && end) {
            const [startVNode, startPosition] = start;
            const [endVNode, endPosition] = end;
            return {
                start: startVNode,
                startPosition: startPosition,
                end: endVNode,
                endPosition: endPosition,
                direction: range instanceof Range ? direction : range.direction,
            };
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
    VNodeFromTag(tag: string): VNode {
        switch (tag) {
            case 'P':
                return new SimpleElementNode(VNodeType.PARAGRAPH);
            case 'H1':
                return new SimpleElementNode(VNodeType.HEADING1);
            case 'H2':
                return new SimpleElementNode(VNodeType.HEADING2);
            case 'H3':
                return new SimpleElementNode(VNodeType.HEADING3);
            case 'H4':
                return new SimpleElementNode(VNodeType.HEADING4);
            case 'H5':
                return new SimpleElementNode(VNodeType.HEADING5);
            case 'H6':
                return new SimpleElementNode(VNodeType.HEADING6);
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
    parseElementNode(currentContext: ParsingContext): ParsingContext {
        const context = { ...currentContext };

        const node = context.node;
        const parsedNode: VNode = this.VNodeFromTag(node.nodeName);
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
                underline: format.underline || node.nodeName === 'U',
            });
        } else {
            if (parsedNode instanceof CharNode) {
                Object.assign(parsedNode.format, context.format[0]);
            }
            VDocumentMap.set(parsedNode, node);
            context.parentVNode.append(parsedNode);
        }
        // A <br/> with no siblings is there only to make its parent visible.
        // Consume it since it was just parsed as its parent element node.
        // TODO: do this less naively to account for formatting space.
        if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR') {
            context.node = node.childNodes[0];
            VDocumentMap.set(parsedNode, context.node);
        }
        // A trailing <br/> after another <br/> is there only to make its previous
        // sibling visible. Consume it since it was just parsed as a single BR
        // within our abstraction.
        // TODO: do this less naively to account for formatting space.
        if (
            node.nodeName === 'BR' &&
            node.nextSibling &&
            node.nextSibling.nodeName === 'BR' &&
            !node.nextSibling.nextSibling
        ) {
            context.node = node.nextSibling;
            VDocumentMap.set(parsedNode, context.node);
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
    parseTextNode(currentContext: ParsingContext): ParsingContext {
        const node = currentContext.node;
        const parentVNode = currentContext.parentVNode;
        const format = currentContext.format[0];
        const text = Parser.removeFormatSpace(node);
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            const parsedVNode = new CharNode(char, { ...format });
            VDocumentMap.set(parsedVNode, node, i);
            parentVNode.append(parsedVNode);
        }
        return currentContext;
    }

    nextParsingContext(currentContext: ParsingContext): ParsingContext {
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
                // Traverse the DOM tree to search for the first parent present in the VDocumentMap.
                // We do so because, some parent are not included in the VDocumentMap
                // (e.g.formatting nodes).
                let elementFound;
                let elementParent = ancestor;
                do {
                    elementParent = elementParent.parentNode;
                    elementFound = VDocumentMap.fromDom(elementParent);
                } while (elementParent && !elementFound);
                nextContext.parentVNode = elementFound[0];
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
    static _isAtSegmentBreak(node: Node, side: 'start' | 'end'): boolean {
        const siblingSide = side === 'start' ? 'previousSibling' : 'nextSibling';
        const sibling = node && node[siblingSide];
        const isAgainstAnotherSegment = sibling && Parser._isSegment(sibling);
        const isAtEdgeOfOwnSegment = Parser._isBlockEdge(node, side);
        // In the DOM, a space before a BR is rendered but a space after a BR isn't.
        const isBeforeBR = side === 'end' && sibling && sibling.nodeName === 'BR';
        return (isAgainstAnotherSegment && !isBeforeBR) || isAtEdgeOfOwnSegment;
    }
    /**
     * Return true if the node is a segment according to W3 formatting model.
     *
     * @param node to check
     */
    static _isSegment(node: Node): boolean {
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
    static _isBlockEdge(node: Node | Node, side: 'start' | 'end'): boolean {
        const ancestorsUpToBlock: Node[] = [];

        // Move up to the first block ancestor
        let ancestor = node;
        while (ancestor && (Parser._isTextNode(ancestor) || !Parser._isSegment(ancestor))) {
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
    static _isTextNode(node: Node): boolean {
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
    static removeFormatSpace(node: Node): string {
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
        if (Parser._isAtSegmentBreak(node, 'start')) {
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
        if (Parser._isAtSegmentBreak(node, 'end')) {
            const endSpace = /[ \u3000]*$/g;
            newText = newText.replace(endSpace, '');
        }
        return newText;
    }
    /**
     * Return a position in the `VDocument` as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _locate(container: Node, offset: number): [VNode, RelativePosition] {
        // When targetting the end of a node, the DOM gives an offset that is
        // equal to the length of the container. In order to retrieve the last
        // descendent, we need to make sure we target an existing node, ie. an
        // existing index.
        const isAfterEnd = offset >= utils.nodeLength(container);
        let index = isAfterEnd ? utils.nodeLength(container) - 1 : offset;
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            container = container.childNodes[index];
            index = isAfterEnd ? utils.nodeLength(container) - 1 : 0;
            // Adapt the offset to be its equivalent within the new container.
            offset = isAfterEnd ? utils.nodeLength(container) : index;
        }
        // Get the VNodes matching the container.
        const vNodes = VDocumentMap.fromDom(container);
        if (vNodes && vNodes.length) {
            let reference: VNode;
            if (container.nodeType === Node.TEXT_NODE) {
                // The reference is the index-th match (eg.: text split into chars).
                reference = vNodes[index];
            } else {
                reference = vNodes[0];
            }
            return reference.locateRange(container, offset);
        }
    }
}
