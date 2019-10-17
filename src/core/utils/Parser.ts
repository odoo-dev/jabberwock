import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';
import { Format } from './Format';
import { VDocumentMap } from './VDocumentMap';

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
function parseNode(context: ParsingContext): ParsingContext {
    switch (context.node.nodeType) {
        case Node.ELEMENT_NODE: {
            return parseElementNode(context);
        }
        case Node.TEXT_NODE: {
            return parseTextNode(context);
        }
        case Node.DOCUMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE: {
            // These nodes have no effect in the context of parsing, but the
            // parsing itself will continue with their children.
            return context;
        }
        case Node.CDATA_SECTION_NODE:
        case Node.PROCESSING_INSTRUCTION_NODE:
        case Node.COMMENT_NODE:
        case Node.DOCUMENT_TYPE_NODE:
        default: {
            throw `Unsupported node type: ${context.node.nodeType}.`;
        }
    }
}

/**
 * Return the `VNodeType` of the given DOM node.
 *
 * @param node
 * @returns the `VNodeType` of the given DOM node
 */
function getNodeType(node: Node): VNodeType {
    switch (node.nodeName) {
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
 * Parse the given DOM Element into VNode(s).
 *
 * @param node to parse
 * @param [format] to apply to the parsed node (default: none)
 * @returns the parsed VNode(s)
 */
function parseElementNode(context: ParsingContext): ParsingContext {
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
        const parsedNode: VNode = new VNode(
            getNodeType(node),
            node.nodeName,
            undefined,
            context.format[0],
        );
        VDocumentMap.set(node, parsedNode);
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
function parseTextNode(context: ParsingContext): ParsingContext {
    const node = context.node;
    const parentVNode = context.parentVNode;
    const format = context.format[0];
    for (let i = 0; i < node.textContent.length; i++) {
        const character: string = node.textContent.charAt(i);
        const parsedNode: VNode = new VNode(VNodeType.CHAR, node.nodeName, character, format);
        VDocumentMap.set(node, parsedNode);
        parentVNode.append(parsedNode);
    }
    return context;
}

function nextParsingContext(context: ParsingContext): ParsingContext {
    const node = context.node;
    if (node.childNodes.length) {
        // Parse the first child with the current node as parent, if any.
        context.node = node.childNodes[0];
        // Text node cannot have children, therefore `node` is an Element, not
        // a text node. Only text nodes can be represented by multiple VNodes,
        // so the first matching VNode can safely be selected from the map.
        // If `node` as no VNode representation  in the map (e.g. format nodes),
        // its children are added into the current `parentVNode`.
        const parsedParent = VDocumentMap.fromDom(node);
        if (parsedParent) {
            context.parentVNode = parsedParent[0];
        }
    } else if (node.nextSibling) {
        // Parse the siblings of the current node with the same parent, if any.
        context.node = node.nextSibling;
    } else {
        // Parse the next ancestor sibling in the ancestor tree, if any.
        let ancestor = node;
        // Climb back the ancestor tree to the first parent having a sibling.
        const rootNode = context.rootNode;
        do {
            ancestor = ancestor.parentNode;
            if (ancestor && Format.tags.includes(ancestor.nodeName)) {
                // Pop last formatting context from the stack
                context.format.shift();
            }
        } while (ancestor && !ancestor.nextSibling && ancestor !== rootNode);
        // At this point, the found ancestor has a sibling.
        if (ancestor && ancestor !== rootNode) {
            // Text node cannot have children, therefore parent is an Element,
            // not a text node. Only text nodes can be represented by multiple
            // VNodes so the first VNode can safely be selected from the map.
            context.node = ancestor.nextSibling;
            context.parentVNode = VDocumentMap.fromDom(ancestor.parentNode)[0];
        } else {
            // If no ancestor having a sibling could be found then the tree has
            // been fully parsed. There is no next parsing context. Stop it.
            return;
        }
    }
    return context;
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
        VDocumentMap.set(node, root);
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
