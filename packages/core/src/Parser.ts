import { VDocument } from './VDocument';
import { Format } from '../../utils/src/Format';
import { VDocumentMap, createMap } from './VDocumentMap';
import { VRangeDescription } from './VRange';
import { Direction, RelativePosition } from '../../utils/src/range';
import { VNode } from './VNodes/VNode';
import { DomRangeDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { VElement } from './VNodes/VElement';
import { FragmentNode } from './VNodes/FragmentNode';
import { FormatType } from '../../plugin-char/CharNode';

export type ParsingMap = Map<VNode, Node[]>;
export interface ParsingContext {
    readonly rootNode?: Node;
    currentNode?: Node;
    parentVNode?: VNode;
    format?: FormatType;
    vDocument: VDocument;
}
export type ParsingPredicate = (node: Node) => ParsingFunction;
export type ParsingFunction = (context: ParsingContext) => [ParsingContext, ParsingMap];

export class Parser {
    parsingPredicates: Set<ParsingPredicate> = new Set();
    _contextStack: Array<ParsingContext> = [];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    get currentContext(): ParsingContext {
        return this._contextStack[this._contextStack.length - 1];
    }
    /**
     * Add a parsing predicate to the ones that this Parser can handle.
     *
     * @param parsingFunctions
     */
    addParsingPredicate(parsingPredicate: ParsingPredicate): void {
        this.parsingPredicates.add(parsingPredicate);
    }
    /**
     * Add parsing predicates to the ones that this Parser can handle.
     *
     * @param parsingFunctions
     */
    addParsingPredicates(...parsingPredicates: Array<ParsingPredicate>): void {
        parsingPredicates.forEach(parsingPredicate => {
            this.parsingPredicates.add(parsingPredicate);
        });
    }
    /**
     * Return a list of vNodes matching the given node.
     */
    parseNode(): [ParsingContext, ParsingMap] {
        const context = { ...this.currentContext };
        if (Format.tags.includes(context.currentNode.nodeName)) {
            // Format nodes (e.g. B, I, U) are parsed differently than regular
            // elements since they are not represented by a proper VNode in our
            // internal representation but by the format of its children.
            // For the parsing, encountering a format node generates a new format
            // context which inherits from the previous one.
            context.format = { ...context.format } || {};
            context.format.bold = !!context.format.bold || context.currentNode.nodeName === 'B';
            context.format.italic = !!context.format.italic || context.currentNode.nodeName === 'I';
            context.format.underline =
                !!context.format.underline || context.currentNode.nodeName === 'U';
            return [context, new Map()];
        }
        for (const parsingPredicate of this.parsingPredicates) {
            const parsingFunction = parsingPredicate(context.currentNode);
            if (parsingFunction) {
                return parsingFunction(context);
            }
        }
        // If the node could not be parsed, create a generic element node with
        // the HTML tag of the DOM Node. This way we may not support the node
        // but we don't break it either.
        const parsingMap = createMap([
            [
                new VElement(this.currentContext.currentNode.nodeName),
                this.currentContext.currentNode,
            ],
        ]);
        return [context, parsingMap];
    }
    /**
     * Parse an HTML element into the editor's virtual representation.
     *
     * @param node the HTML element to parse
     * @returns the element parsed into the editor's virtual representation
     */
    parse(node: Node): VDocument {
        const root = new FragmentNode();
        VDocumentMap.set(root, node);
        const vDocument = new VDocument(root);
        // The tree is parsed in depth-first order traversal.
        // Start with the first child and the whole tree will be parsed.
        if (node.childNodes.length) {
            this._contextStack.push({
                rootNode: node,
                currentNode: node.childNodes[0],
                parentVNode: root,
                vDocument: vDocument,
            });
            do {
                this._parseNode();
            } while (this.currentContext);
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Parse a node depending on its DOM type.
     */
    _parseNode(): void {
        let context;
        switch (this.currentContext.currentNode.nodeType) {
            case Node.ELEMENT_NODE:
            case Node.TEXT_NODE: {
                const parsingResult = this.parseNode();
                context = parsingResult[0];
                const parsingMap = parsingResult[1];
                const node = context.currentNode;
                const parsedNode = parsingMap.keys().next().value;

                // Map the parsed nodes to the DOM nodes they represent, and
                // append them to the VDocument.
                const parentVNode = context.parentVNode;
                Array.from(parsingMap.keys()).forEach(parsedVNode => {
                    const domNodes = parsingMap.get(parsedVNode);
                    if (domNodes.length === 1) {
                        VDocumentMap.set(parsedVNode, domNodes[0]);
                    } else {
                        domNodes.forEach((domNode: Node, index: number) => {
                            VDocumentMap.set(parsedVNode, domNode, index);
                        });
                    }
                    parentVNode.append(parsedVNode);
                });
                // A <br/> with no siblings is there only to make its parent visible.
                // Consume it since it was just parsed as its parent element node.
                // TODO: do this less naively to account for formatting space.
                if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR') {
                    context.currentNode = node.childNodes[0];
                    VDocumentMap.set(parsedNode, context.currentNode);
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
                    context.currentNode = node.nextSibling;
                    VDocumentMap.set(parsedNode, context.currentNode);
                }

                break;
            }
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE: {
                // These nodes have no effect in the context of parsing, but the
                // parsing itself will continue with their children.
                context = this.currentContext;
                break;
            }
            case Node.CDATA_SECTION_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            default: {
                throw `Unsupported node type: ${this.currentContext.currentNode.nodeType}.`;
            }
        }
        this._nextParsingContext(context);
    }
    _nextParsingContext(context: ParsingContext): void {
        const node = context.currentNode;
        if (node.childNodes.length) {
            // Parse the first child with the current node as parent, if any.
            context.currentNode = node.childNodes[0];
            // Text node cannot have children, therefore `node` is an Element, not
            // a text node. Only text nodes can be represented by multiple VNodes,
            // so the first matching VNode can safely be selected from the map.
            // If `node` as no VNode representation  in the map (e.g. format nodes),
            // its children are added into the current `parentVNode`.
            const parsedParent = VDocumentMap.fromDom(node);
            if (parsedParent) {
                context.parentVNode = parsedParent[0];
            }
            this._contextStack.push({ ...context });
        } else if (node.nextSibling) {
            // Parse the siblings of the current node with the same parent, if any.
            this.currentContext.currentNode = node.nextSibling;
        } else {
            // Parse the next ancestor sibling in the ancestor tree, if any.
            let ancestor = node;
            // Climb back the ancestor tree to the first parent having a sibling.
            const rootNode = context.rootNode;
            while (ancestor && !ancestor.nextSibling && ancestor !== rootNode) {
                ancestor = ancestor.parentNode;
                this._contextStack.pop();
            }
            // At this point, the found ancestor has a sibling.
            if (ancestor && ancestor !== rootNode) {
                if (!this.currentContext) {
                    // If we went back up the whole stack, we start with a new
                    // context.
                    this._contextStack.push({
                        rootNode: context.rootNode,
                        currentNode: ancestor.nextSibling,
                        parentVNode: context.parentVNode,
                        vDocument: context.vDocument,
                    });
                } else {
                    // Text node cannot have children, therefore parent is an Element,
                    // not a text node. Only text nodes can be represented by multiple
                    // VNodes so the first VNode can safely be selected from the map.
                    this.currentContext.currentNode = ancestor.nextSibling;
                }
            } else {
                // If no ancestor having a sibling could be found then the tree has
                // been fully parsed. There is no next parsing context. Stop it.
                return;
            }
        }
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
