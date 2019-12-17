import { VDocument } from './VDocument';
import { formatMap } from '../../plugin-format/src/formatMap';
import { VDocumentMap } from './VDocumentMap';
import { VRangeDescription } from './VRange';
import { Direction, RelativePosition } from '../../utils/src/range';
import { VNode } from './VNodes/VNode';
import { DomRangeDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { VElement } from './VNodes/VElement';
import { FragmentNode } from './VNodes/FragmentNode';
import { Attribute, AttributeName } from './VNodes/Attribute';

interface ParsingContext {
    readonly rootNode?: Node;
    node?: Node;
    parentVNode?: VNode;
    attributes?: Map<AttributeName, Attribute>;
    vDocument: VDocument;
}
export type ParsingFunction = (node: Node) => VNode[] | Set<Attribute>;

export class Parser {
    _VNodes: Set<typeof VNode> = new Set();
    parsingFunctions: Set<ParsingFunction> = new Set();

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
     * Add a method to the ones that this Parser uses to parse DOM nodes.
     *
     * @param parseMethod
     */
    addParseMethod(parseMethod: ParsingFunction): void {
        this.parsingFunctions.add(parseMethod);
    }
    /**
     * Return a list of vNodes matching the given node.
     *
     * @param node
     */
    parseNode(node: Node): VNode[] | Set<Attribute> {
        for (const parseMethod of this.parsingFunctions) {
            const parseResult = parseMethod(node);
            if (parseResult) {
                return parseResult;
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
                attributes: new Map(),
                vDocument: vDocument,
            };
            do {
                context = this._parseNode(context);
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
     *
     * @param currentContext The current context
     * @returns The next parsing context
     */
    _parseNode(currentContext: ParsingContext): ParsingContext {
        const context = { ...currentContext };
        const node = context.node;
        const parseResult = this.parseNode(node);
        if (Array.isArray(parseResult)) {
            parseResult.forEach(parsedNode => {
                context.attributes.forEach(attribute => {
                    parsedNode.attributes.set(attribute.name, attribute.copy());
                });
                VDocumentMap.set(parsedNode, node);
                context.parentVNode.append(parsedNode);
            });
        } else {
            parseResult.forEach(attribute => {
                context.attributes.set(attribute.name, attribute.copy());
            });
        }
        // A <br/> with no siblings is there only to make its parent visible.
        // Consume it since it was just parsed as its parent element node.
        // TODO: do this less naively to account for formatting space.
        if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR') {
            context.node = node.childNodes[0];
            if (Array.isArray(parseResult)) {
                parseResult.forEach((parsedNode: VNode) => {
                    VDocumentMap.set(parsedNode, context.node);
                });
            }
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
            if (Array.isArray(parseResult)) {
                parseResult.forEach((parsedNode: VNode) => {
                    VDocumentMap.set(parsedNode, context.node);
                });
            }
        }
        return this._nextParsingContext(context);
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
                if (ancestor && formatMap.tags.includes(ancestor.nodeName)) {
                    // Pop last formatting context from the stack
                    nextContext.attributes.clear();
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
            return reference.locateRange(container, offset);
        }
    }
}
