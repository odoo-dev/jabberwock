import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { utils } from './utils';

function _getNodeType(node: Element): VNodeType {
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
 * Parse a text node.
 */
function _parseTextNode(node: Element, format?: FormatType): VNode[] {
    const parsedNodes: VNode[] = [];
    for (let i = 0; i < node.textContent.length; i++) {
        const char: string = node.textContent.charAt(i);
        const parsedNode: VNode = new VNode(VNodeType.CHAR, node.tagName, char, format);
        parsedNodes.push(parsedNode);
    }
    return parsedNodes;
}
/**
 * Parse an (non-text, non-format) element.
 */
function _parseElement(node: Element, format?: FormatType): VNode[] {
    const parsedNode: VNode = new VNode(_getNodeType(node), node.tagName, undefined, format);
    const children: Element[] = utils._collectionToArray(node.childNodes);
    children.forEach(child => {
        const parsedChildren: VNode[] = _parseOne(child);
        parsedChildren.forEach(parsedChild => {
            parsedNode.append(parsedChild);
        });
    });
    return [parsedNode];
}
/**
 * Parse a format element (i, b, u) by parsing its children, passing the format
 * to them as an attribute.
 */
function _parseFormatElement(node: Element, format?: FormatType): VNode[] {
    format = {
        bold: (format && format.bold) || node.tagName === 'B',
        italic: (format && format.italic) || node.tagName === 'I',
        underlined: (format && format.underlined) || node.tagName === 'U',
    };
    let parsedChildren: VNode[] = [];
    const children: Element[] = utils._collectionToArray(node.childNodes);
    children.forEach(child => {
        const parsedChild: VNode[] = _parseOne(child, format);
        parsedChildren = parsedChildren.concat(parsedChild);
    });
    return parsedChildren;
}
/**
 * Parse a DOM fragment or its representation as a string.
 */
function _parseOne(node: Element, format?: FormatType): VNode[] {
    switch (node.tagName) {
        case undefined: // Text node
            return _parseTextNode(node, format);
        case 'B':
        case 'I':
        case 'U':
            return _parseFormatElement(node, format);
        default:
            return _parseElement(node, format);
    }
}
/**
 * Parse a DOM fragment or its representation as a string.
 */
function parse(fragment: DocumentFragment): VNode[] {
    let parsedNodes: VNode[] = [];
    const contents: NodeListOf<ChildNode> = fragment.childNodes;
    const children: Element[] = utils._collectionToArray(contents);
    children.forEach(child => {
        const parsedChildren: VNode[] = _parseOne(child);
        if (parsedChildren.length) {
            parsedNodes = parsedNodes.concat(parsedChildren);
        }
    });
    return parsedNodes;
}

const parser = {
    parse: parse,
    _getNodeType: _getNodeType,
    _parseOne: _parseOne,
};

export default parser;
