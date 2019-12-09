import { VDocument } from './VDocument';
import { Format, FormatType } from '../../utils/src/Format';
import { VDocumentMap } from './VDocumentMap';
import { VRangeDescription } from './VRange';
import { Direction, RelativePosition } from '../../utils/src/range';
import { VNode } from './VNode';
import { DomRangeDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { SimpleElementNode } from './VNodes/SimpleElementNode';
import { LineBreakNode } from './VNodes/LineBreakNode';
import { RootNode } from './VNodes/RootNode';
import { RangeNode } from './VNodes/RangeNode';
import { CharNode } from './VNodes/CharNode';

interface ParsingContext {
    readonly rootNode?: Node;
    node?: Node;
    parentVNode?: VNode;
    format?: FormatType;
    vDocument: VDocument;
}
export const defaultNodes = [CharNode, LineBreakNode, RangeNode, SimpleElementNode];

export class Parser {
    _customVNodes: Set<typeof VNode> = new Set();
    constructor(replaceDefaultNodes?: Array<typeof VNode>) {
        this.addCustomVNodes(replaceDefaultNodes || defaultNodes);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a custom VNode to the ones that this Parser can handle.
     *
     * @param VNodeClasses
     */
    addCustomVNode(VNodeClass: typeof VNode): void {
        this._customVNodes.add(VNodeClass);
    }
    /**
     * Add an array of custom VNodes to the ones that this Parser can handle.
     *
     * @param VNodeClasses
     */
    addCustomVNodes(VNodeClasses: Array<typeof VNode>): void {
        VNodeClasses.forEach(VNodeClass => {
            this._customVNodes.add(VNodeClass);
        });
    }
    /**
     * Return a (list of) vNode(s) matching the given node.
     *
     * @param node
     */
    parseNode(node: Node): VNode | Array<VNode> {
        let vNode: VNode | Array<VNode> | null;
        Array.from(this._customVNodes).some(customNode => {
            vNode = customNode.parse(node);
            return vNode !== null;
        });
        return vNode || new VNode(node.nodeName);
    }
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
                format: {},
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
        const parsedNode = this.parseNode(node) as VNode;
        if (Format.tags.includes(context.node.nodeName)) {
            // Format nodes (e.g. B, I, U) are parsed differently than regular
            // elements since they are not represented by a proper VNode in our
            // internal representation but by the format of its children.
            // For the parsing, encountering a format node generates a new format
            // context which inherits from the previous one.
            const format = context.format || {};
            context.format = Format.formats.reduce((accumulator, formatName) => {
                return {
                    ...accumulator,
                    [formatName]: format[formatName] || node.nodeName === Format.toTag(formatName),
                };
            }, {});
        } else {
            if (parsedNode instanceof CharNode) {
                Object.assign(parsedNode.format, context.format);
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
        const format = currentContext.format;
        const parsedVNodes = this.parseNode(node) as CharNode[];
        parsedVNodes.forEach((parsedVNode: CharNode, index: number) => {
            parsedVNode.format = { ...format };
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
                    nextContext.format[Format.fromTag(ancestor.nodeName)] = false;
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
