import { VDocument } from './VDocument';
import { Format } from '../../utils/src/Format';
import { VDocumentMap } from './VDocumentMap';
import { Direction, VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { DomSelectionDescription } from './EventNormalizer';
import { utils } from '../../utils/src/utils';
import { VElement } from './VNodes/VElement';
import { FragmentNode } from './VNodes/FragmentNode';
import { FormatType } from '../../plugin-char/CharNode';
import { ListNode } from '../../plugin-list/ListNode';
import { ParagraphNode } from '../../plugin-paragraph/ParagraphNode';

const listTags = ['UL', 'OL'];
const listContextTags = listTags.concat('LI');

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
     * Parse the current node and return the result.
     *
     * @param currentContext
     */
    parseNode(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
        const context = { ...currentContext };
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
        for (const parse of this.parsingFunctions) {
            const parseResult = parse({ ...currentContext });
            if (parseResult) {
                return parseResult;
            }
        }
        // If the node could not be parsed, create a generic element node with
        // the HTML tag of the DOM Node. This way we may not support the node
        // but we don't break it either.
        const parsingMap = new Map([
            [new VElement(currentContext.currentNode.nodeName), [currentContext.currentNode]],
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
                currentContext = this._parseOne(currentContext);
            } while (currentContext);
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
     * Parse a list node.
     */
    _parseList(currentContext: ParsingContext): ParsingContext {
        const parentNode = currentContext.currentNode.parentNode;
        const parentName = parentNode && parentNode.nodeName;
        const parentVNode = currentContext.parentVNode;
        if (listContextTags.includes(parentName) && !parentVNode.is(ListNode)) {
            // We're about to parse an indented list. In our abstraction, an
            // indented list is a direct child of its parent list, regardless
            // of what was already in its <li> parent. So the following example:
            // <ul><li>abc<ul><li>def</li></ul></li></ul>
            // when parsed in our abstraction is equivalent to:
            // <ul><li>abc</li><li><ul><li>def</li></ul></li></ul>
            // Both will eventually be rendered as the former.
            // Set the parent to be the list node rather than the list item.
            currentContext.parentVNode = parentVNode.ancestor(ListNode);
        }
        return currentContext;
    }
    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    _parseListItem(currentContext: ParsingContext): ParsingContext {
        const context = { ...currentContext };
        const children = Array.from(context.currentNode.childNodes);
        // An empty text node as first child should be skipped.
        while (children.length && this._isEmptyTextNode(children[0])) {
            children.shift();
        }
        // A list item with no children should be skipped.
        if (!children.length) {
            return context;
        }
        // A list item containing only a BR should be replaced with an
        // empty paragraph.
        if (children.length === 1 && children[0].nodeName === 'BR') {
            const paragraph = new ParagraphNode(); // todo: remove reference to plugin
            context.parentVNode.append(paragraph);
            VDocumentMap.set(paragraph, context.currentNode);
            VDocumentMap.set(paragraph, children[0]);
            this._contextStack.push({ ...context }); // todo: find a better way
            return { ...context, currentNode: children[0] };
        }
        // Inline elements in a list item should be wrapped in a paragraph.
        if (!utils.isBlock(children[0]) || children[0].nodeName === 'BR') {
            const paragraph = new ParagraphNode(); // todo: remove reference to plugin
            context.parentVNode.append(paragraph);
            context.parentVNode = paragraph;
            VDocumentMap.set(paragraph, context.currentNode);
        }
        // Now we can move on to the list item's contents, to be added to
        // the paragraph created above, or to the list itself in the case of
        // blocks.
        return context;
    }
    /**
     * Parse a node depending on its DOM type.
     */
    _parseOne(currentContext: ParsingContext): ParsingContext {
        if (listTags.includes(currentContext.currentNode.nodeName)) {
            currentContext = this._parseList({ ...currentContext });
        } else if (currentContext.currentNode.nodeName === 'LI') {
            // todo: find a better way
            return this._nextParsingContext(this._parseListItem({ ...currentContext }));
        }
        const [context, parsingMap] = this.parseNode({ ...currentContext });
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

        return this._nextParsingContext(context);
    }
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
     * Return true if the node is a text node containing only whitespace or nothing.
     *
     * @param node
     */
    _isEmptyTextNode(node: Node): boolean {
        return node.nodeType === Node.TEXT_NODE && /^\s*$/.test(node.textContent);
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
