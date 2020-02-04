import { VDocument } from './VDocument';
import { Format } from '../../utils/src/Format';
import { VDocumentMap } from './VDocumentMap';
import { Direction, VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { DomSelectionDescription } from './EventNormalizer';
import { nodeLength } from '../../utils/src/utils';
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

export type ParsingFunction = (context: ParsingContext) => [ParsingContext, ParsingMap];

export class Parser {
    parsingFunctions: Set<ParsingFunction> = new Set();
    _contextStack: Array<ParsingContext> = [];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add parsing functions to the ones that this Parser can handle.
     *
     * @param parsingFunctions
     */
    addParsingFunction(...parsingFunctions: Array<ParsingFunction>): void {
        parsingFunctions.forEach(parsingFunction => {
            this.parsingFunctions.add(parsingFunction);
        });
    }
    /**
     * Parse a node depending on its DOM type.
     *
     * @param currentContext
     */
    parseNode(currentContext: ParsingContext): ParsingContext {
        let parseResult: [ParsingContext, ParsingMap];
        if (Format.tags.includes(currentContext.currentNode.nodeName)) {
            // Format nodes (e.g. B, I, U) are parsed differently than regular
            // elements since they are not represented by a proper VNode in our
            // internal representation but by the format of its children.
            // For the parsing, encountering a format node generates a new format
            // context which inherits from the previous one.
            currentContext.format = { ...currentContext.format } || {};
            currentContext.format.bold =
                !!currentContext.format.bold || currentContext.currentNode.nodeName === 'B';
            currentContext.format.italic =
                !!currentContext.format.italic || currentContext.currentNode.nodeName === 'I';
            currentContext.format.underline =
                !!currentContext.format.underline || currentContext.currentNode.nodeName === 'U';
            parseResult = [currentContext, new Map()];
        } else {
            for (const parse of this.parsingFunctions) {
                parseResult = parse({ ...currentContext });
                if (parseResult) {
                    break;
                }
            }
            if (!parseResult) {
                // If the node could not be parsed, create a generic element node with
                // the HTML tag of the DOM Node. This way we may not support the node
                // but we don't break it either.
                const parsedNode = new VElement(currentContext.currentNode.nodeName);
                const parsingMap = new Map([[parsedNode, [currentContext.currentNode]]]);
                currentContext.parentVNode.append(parsedNode);
                parseResult = [currentContext, parsingMap];
            }
        }

        const context: ParsingContext = parseResult[0];
        const parsingMap: ParsingMap = parseResult[1];

        // Map the parsed nodes to the DOM nodes they represent.
        for (const [parsedVNode, domNodes] of parsingMap) {
            if (domNodes.length === 1) {
                VDocumentMap.set(parsedVNode, domNodes[0]);
            } else {
                domNodes.forEach((domNode: Node, index: number) => {
                    VDocumentMap.set(parsedVNode, domNode, index);
                });
            }
        }

        return context;
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
        const rootContext: ParsingContext = {
            rootNode: node,
            currentNode: node,
            parentVNode: root,
            vDocument: vDocument,
        };
        this._contextStack.push(rootContext);
        // The tree is parsed in depth-first order traversal.
        // Start with the first child and the whole tree will be parsed.
        if (node.childNodes.length) {
            let currentContext: ParsingContext = {
                ...rootContext,
                currentNode: node.firstChild,
            };
            this._contextStack.push(currentContext);
            do {
                currentContext = this.parseNode({ ...currentContext });
            } while ((currentContext = this._nextParsingContext(currentContext)));
        }

        // Parse the DOM selection.
        const selection = node.ownerDocument.getSelection();
        if (
            selection &&
            node.contains(selection.anchorNode) &&
            node.contains(selection.focusNode)
        ) {
            vDocument.selection.set(this.parseSelection(selection));
        }

        return vDocument;
    }
    /**
     * Parse the dom selection into the description of a VSelection.
     *
     * @param selection
     * @param [direction]
     */
    parseSelection(selection: Selection | DomSelectionDescription): VSelectionDescription {
        const start = this._locate(selection.anchorNode, selection.anchorOffset);
        const end = this._locate(selection.focusNode, selection.focusOffset);
        if (start && end) {
            const [startVNode, startPosition] = start;
            const [endVNode, endPosition] = end;

            let direction: Direction;
            if (selection instanceof Selection) {
                const domRange = selection.rangeCount && selection.getRangeAt(0);
                if (
                    domRange.startContainer === selection.anchorNode &&
                    domRange.startOffset === selection.anchorOffset
                ) {
                    direction = Direction.FORWARD;
                } else {
                    direction = Direction.BACKWARD;
                }
            } else {
                direction = selection.direction;
            }

            return {
                anchorNode: startVNode,
                anchorPosition: startPosition,
                focusNode: endVNode,
                focusPosition: endPosition,
                direction: direction,
            };
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _nextParsingContext(currentContext: ParsingContext): ParsingContext {
        const node = currentContext.currentNode;
        if (node.childNodes.length) {
            // Parse the first child with the current node as parent, if any.
            currentContext.currentNode = node.childNodes[0];
            // Text node cannot have children, therefore `node` is an Element, not
            // a text node. Only text nodes can be represented by multiple VNodes,
            // so the first matching VNode can safely be selected from the map.
            // If `node` as no VNode representation  in the map (e.g. format nodes),
            // its children are added into the current `parentVNode`.
            const parsedParent = VDocumentMap.fromDom(node);
            if (parsedParent) {
                currentContext.parentVNode = parsedParent[0];
            }
            this._contextStack.push({ ...currentContext });
        } else if (node.nextSibling) {
            // Parse the siblings of the current node with the same parent, if any.
            this._contextStack[this._contextStack.length - 1].currentNode = node.nextSibling;
        } else {
            // Parse the next ancestor sibling in the ancestor tree, if any.
            let ancestor = node;
            // Climb back the ancestor tree to the first parent having a sibling.
            const rootNode = currentContext.rootNode;
            while (ancestor && !ancestor.nextSibling && ancestor !== rootNode) {
                ancestor = ancestor.parentNode;
                this._contextStack.pop();
            }
            // At this point, the found ancestor has a sibling.
            if (ancestor && ancestor !== rootNode) {
                // Text node cannot have children, therefore parent is an Element,
                // not a text node. Only text nodes can be represented by multiple
                // VNodes so the first VNode can safely be selected from the map.
                this._contextStack[this._contextStack.length - 1].currentNode =
                    ancestor.nextSibling;
            } else {
                // If no ancestor having a sibling could be found then the tree has
                // been fully parsed. There is no next parsing context. Stop it.
                return;
            }
        }
        return this._contextStack[this._contextStack.length - 1];
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
        const isAfterEnd = offset >= nodeLength(container);
        let index = isAfterEnd ? nodeLength(container) - 1 : offset;
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            container = container.childNodes[index];
            index = isAfterEnd ? nodeLength(container) - 1 : 0;
            // Adapt the offset to be its equivalent within the new container.
            offset = isAfterEnd ? nodeLength(container) : index;
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
            return reference.locate(container, offset);
        }
    }
}
