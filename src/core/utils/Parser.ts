import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';
import { Format } from './Format';

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
    static parse(element: DOMElement): VDocument {
        const root = new VNode(VNodeType.ROOT);
        Array.from(element.childNodes).forEach(child => {
            const parsedNodes: VNode[] = this._parseOne(child);
            parsedNodes.forEach(node => root.append(node));
        });
        return new VDocument(root);
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
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseElement(node: DOMElement, format?: FormatType): VNode[] {
        const parsedNode: VNode = new VNode(
            this._getNodeType(node),
            node.tagName,
            undefined,
            format,
        );
        const children: DOMElement[] = Array.from(node.childNodes);
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
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseFormatElement(node: DOMElement, format?: FormatType): VNode[] {
        format = {
            bold: (format && format.bold) || node.tagName === 'B',
            italic: (format && format.italic) || node.tagName === 'I',
            underlined: (format && format.underlined) || node.tagName === 'U',
        };
        let parsedChildren: VNode[] = [];
        const children: DOMElement[] = Array.from(node.childNodes);
        children.forEach(child => {
            const parsedChild: VNode[] = this._parseOne(child, format);
            parsedChildren = parsedChildren.concat(parsedChild);
        });
        return parsedChildren;
    }
    /**
     * Parse a DOM fragment or its representation as a string.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseOne(node: DOMElement, format?: FormatType): VNode[] {
        if (node.nodeType === Node.TEXT_NODE) {
            // Text node
            return this._parseTextNode(node, format);
        } else if (Format.tags.includes(node.tagName)) {
            // Format node
            return this._parseFormatElement(node, format);
        } else {
            // Regular element
            return this._parseElement(node, format);
        }
    }
    /**
     * Parse a text node.
     *
     * @param {Element} node the node to parse
     * @param {FormatType} [format] the format to apply to the parsed node (default: none)
     * @returns {VNode[]} the parsed node(s)
     */
    static _parseTextNode(node: DOMElement, format?: FormatType): VNode[] {
        const parsedNodes: VNode[] = [];
        for (let i = 0; i < node.textContent.length; i++) {
            const char: string = node.textContent.charAt(i);
            const parsedNode: VNode = new VNode(VNodeType.CHAR, node.tagName, char, format);
            parsedNodes.push(parsedNode);
        }
        return parsedNodes;
    }
}
