import { VDocument } from './VDocument';
import { Format } from '../../utils/src/Format';
import { VDocumentMap } from './VDocumentMap';
import { Direction, VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { DomSelectionDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { VElement } from './VNodes/VElement';
import { LineBreakNode } from './VNodes/LineBreakNode';
import { FragmentNode } from './VNodes/FragmentNode';
import { FormatType, CharNode } from './VNodes/CharNode';

interface ParsingContext {
    readonly rootNode?: Node;
    node?: Node;
    parentVNode?: VNode;
    format?: FormatType[];
    vDocument: VDocument;
}

export type ParsingFunction = (node: Node) => VNode[];

export class Parser {
    // TODO: Make this Parser node agnostic so these VNodes can be optional plugins.
    parsingFunctions: Set<ParsingFunction> = new Set([
        CharNode.parse,
        LineBreakNode.parse,
        VElement.parse,
    ]);

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add parsing functions to the ones that this Parser can handle.
     *
     * @param parsingFunctions
     */
    addParsingFunction(...parsingFunctions: Array<ParsingFunction>): void {
        parsingFunctions.forEach(VNodeClass => {
            this.parsingFunctions.add(VNodeClass);
        });
    }
    /**
     * Return a list of vNodes matching the given node.
     *
     * @param node
     */
    parseNode(node: Node): VNode[] {
        for (const parse of this.parsingFunctions) {
            const vNodes = parse(node);
            if (vNodes) {
                return vNodes;
            }
        }
        // If the node could not be parsed, create a generic element node with
        // the HTML tag of the DOM Node. This way we may not support the node
        // but we don't break it either.
        return [new VElement(node.nodeName)];
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
            let context: ParsingContext = {
                rootNode: node,
                node: node.childNodes[0],
                parentVNode: root,
                format: [],
                vDocument: vDocument,
            };
            do {
                context = this._parseNode(context);
            } while (context);
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

        // Set a default selection in VDocument if none was set yet.
        if (!vDocument.selection.anchor.parent || !vDocument.selection.focus.parent) {
            vDocument.selection.setAt(vDocument.root);
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

    /**
     * Parse a node depending on its DOM type.
     *
     * @param currentContext The current context
     * @returns The next parsing context
     */
    _parseNode(currentContext: ParsingContext): ParsingContext {
        let context;
        switch (currentContext.node.nodeType) {
            case Node.ELEMENT_NODE: {
                context = this._parseElementNode(currentContext);
                break;
            }
            case Node.TEXT_NODE: {
                context = this._parseTextNode(currentContext);
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
        return this._nextParsingContext(context);
    }
    /**
     * Parse the given DOM Element into VNode(s).
     *
     * @param node to parse
     * @param [format] to apply to the parsed node (default: none)
     * @returns the parsed VNode(s)
     */
    _parseElementNode(currentContext: ParsingContext): ParsingContext {
        const context = { ...currentContext };

        const node = context.node;
        const parsedNode = this.parseNode(node)[0] as VNode;
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
    _parseTextNode(currentContext: ParsingContext): ParsingContext {
        const node = currentContext.node;
        const parentVNode = currentContext.parentVNode;
        const format = currentContext.format[0];
        const parsedVNodes = this.parseNode(node) as CharNode[];
        parsedVNodes.forEach((parsedVNode: CharNode, index: number) => {
            parsedVNode.format = { ...parsedVNode.format, ...format };
            VDocumentMap.set(parsedVNode, node, index);
            parentVNode.append(parsedVNode);
        });
        return currentContext;
    }
    _nextParsingContext(currentContext: ParsingContext): ParsingContext {
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
            return reference.locate(container, offset);
        }
    }
}
