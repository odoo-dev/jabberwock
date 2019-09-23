import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { utils } from './utils';

export class Parser {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Parse a DOM fragment or its representation as a string.
     *
     * @param {Element} element the node to parse
     * @returns {VNode[]} the parsed node(s)
     */
    static parse(element: HTMLElement): VNode[] {
        let parsedNodes: VNode[] = [];
        const contents: NodeListOf<ChildNode> = element.childNodes;
        const children: Element[] = utils._collectionToArray(contents);
        children.forEach(child => {
            const parsedChildren: VNode[] = this._parseOne(child);
            if (parsedChildren.length) {
                parsedNodes = parsedNodes.concat(parsedChildren);
            }
        });
        return parsedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a DOM node and return its `VNodeType`.
     *
     * @param {Element} node
     * @returns {VNodeType}
     */
    static _getNodeType(node: Element): VNodeType {
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
     * Parse an (non-text, non-format) element.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseElement(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        const domMatch: DOMElement[] = [node as DOMElement];
        if (matchWith) {
            domMatch.push(matchWith as DOMElement);
        }
        const parsedNode: VNode = new VNode(this._getNodeType(node), domMatch, undefined, format);
        const children: Element[] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            const parsedChildren: VNode[] = this._parseOne(child);
            parsedChildren.forEach(parsedChild => {
                parsedNode.append(parsedChild);
            });
        });
        return [parsedNode];
    }
    /**
     * Parse a format element (i, b, u) by parsing its children, passing the format
     * to them as an attribute.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseFormatElement(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        format = {
            bold: (format && format.bold) || node.tagName === 'B',
            italic: (format && format.italic) || node.tagName === 'I',
            underlined: (format && format.underlined) || node.tagName === 'U',
        };
        let parsedChildren: VNode[] = [];
        const children: Element[] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            const parsedChild: VNode[] = this._parseOne(child, format, matchWith || node);
            parsedChildren = parsedChildren.concat(parsedChild);
        });
        return parsedChildren;
    }
    /**
     * Parse a DOM fragment or its representation as a string.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseOne(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        switch (node.tagName) {
            case undefined: // Text node
                return this._parseTextNode(node, format, matchWith);
            case 'B':
            case 'I':
            case 'U':
                return this._parseFormatElement(node, format, matchWith);
            default:
                return this._parseElement(node, format, matchWith);
        }
    }
    /**
     * Parse a text node.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @param {Element} [matchWith] the DOM node to match it with (default: `node`)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseTextNode(node: Element, format?: FormatType, matchWith?: Element): VNode[] {
        const parsedNodes: VNode[] = [];
        for (let i = 0; i < node.textContent.length; i++) {
            const char: string = node.textContent.charAt(i);
            const domMatch: DOMElement[] = [node as DOMElement];
            if (matchWith) {
                domMatch.push(matchWith as DOMElement);
            }
            const parsedNode: VNode = new VNode(VNodeType.CHAR, domMatch, char, format);
            parsedNodes.push(parsedNode);
        }
        return parsedNodes;
    }
}
