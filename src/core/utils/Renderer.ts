import { VNode, VNodeType, FormatType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';

// TODO: centralize
const formats = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
};
const formatTags = Object.keys(formats).map(key => formats[key]);

export class Renderer {
    vDocument: VDocument;
    // When aggregating char nodes to render a text node, this keeps the current
    // list of char nodes to aggregate:
    _currentCharNodes: VNode[] = [];
    _lastCreatedNode: DOMElement | Node;
    constructor(vDocument: VDocument) {
        this.vDocument = vDocument;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    render(target: Element): void {
        target.innerHTML = ''; // TODO: update instead of recreate
        this.vDocument.domMap = new Map(); // TODO: update instead of recreate
        const fragment: DocumentFragment = document.createDocumentFragment();
        this._renderBranch(this.vDocument.contents, fragment);
        target.appendChild(fragment);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a node's formats, create the relevant format nodes and append them
     * to the given parent and each other (parent > 1st-format > 2d-format ...)
     *
     * @param format the node's formats
     * @param parent the parent in which to append the first format node
     */
    _createFormatNodes(format: FormatType, parent: Element | DocumentFragment): Element[] {
        const formatsToApply: string[] = Object.keys(format).filter(
            (key: string): boolean => format[key],
        );
        return formatsToApply.map(
            (key: string): Element => {
                const tag = formats[key];
                const formatNode = document.createElement(tag);
                parent.appendChild(formatNode);
                parent = formatNode;
                return formatNode;
            },
        );
    }
    /**
     * Return a string containing the aggregated text of all CHAR VNodes that
     * are inside `this._currentCharNodes`, for rendering.
     */
    _getCurrentText(): string {
        let text = '';
        this._currentCharNodes.forEach((vNode: VNode): void => {
            text += vNode.value;
        });
        return text;
    }
    /**
     * Take a `VNodeType` and return the corresponding `tagName`, if any.
     *
     * @param vNodeType
     */
    _getTagName(vNodeType: VNodeType): string {
        switch (vNodeType) {
            case 'CHAR':
                return;
            case 'HEADING1':
            case 'HEADING2':
            case 'HEADING3':
            case 'HEADING4':
            case 'HEADING5':
            case 'HEADING6':
                return 'H' + vNodeType[7];
            case 'LINE_BREAK':
                return 'BR';
            case 'PARAGRAPH':
                return 'P';
        }
    }
    /**
     * Render a VNode and its children.
     *
     * @param vNode the node to render
     * @param parent the parent in which to append it
     */
    _renderBranch(vNode: VNode, parent: Element | DocumentFragment): void {
        /* If the node has a format, render that format node first
           Note: Later we remove the empty ones and do the DomMap matching
                 (see at the bottom of this method). */
        const formatNodes: Element[] = this._createFormatNodes(vNode.format, parent);
        parent = formatNodes.length ? formatNodes[formatNodes.length - 1] : parent;

        // If this is the end of a series of characters, render that text
        if (vNode.type !== 'CHAR' && this._currentCharNodes.length) {
            this._renderText(parent);
        }

        // Create the element matching this vNode if possible, and append it
        parent = this._renderOne(vNode, parent) || parent;

        // Render the children
        vNode.children.forEach((child: VNode): void => {
            this._renderBranch(child, parent);
        });

        // Render aggregated text at the end of an element
        if (!vNode.nextSibling && this._currentCharNodes.length) {
            this._renderText(parent);
        }

        // Remove empty format nodes (due to technical spaces)
        // and ensure proper DOM/VDoc matching
        if (formatNodes.length) {
            formatNodes.forEach((formatNode: Element): void => {
                if (!formatNode.childNodes.length) {
                    formatNode.remove();
                } else {
                    this._setMap(formatNode, vNode);
                }
            });
            this._lastCreatedNode = formatNodes[formatNodes.length - 1];
        }
    }
    /**
     * Render a single VNode. Return the created node if any.
     *
     * @param vNode the node to render
     * @param parent the parent in which to append it
     */
    _renderOne(vNode: VNode, parent: Element | DocumentFragment): Element | void {
        // Node is root
        if (vNode.type === 'ROOT') {
            return;
        }
        // Node is character
        if (vNode.type === 'CHAR') {
            this._currentCharNodes.push(vNode);
            return;
        }
        // Node is element
        const tagName: string = this._getTagName(vNode.type);
        const createdNode: Element = document.createElement(tagName);
        parent.appendChild(createdNode);
        this._setMap(createdNode, vNode);
        this._lastCreatedNode = createdNode;
        return createdNode;
    }
    /**
     * Render the CHAR VNodes in `this._currentCharNodes` as one text node.
     * Then reinitialize `this._currentCharNodes`.
     *
     * @param parent the parent in which to append the text node
     */
    _renderText(parent: Element | DocumentFragment): void {
        const text = this._getCurrentText();
        const textNode: Text = document.createTextNode(text);
        parent.appendChild(textNode);
        // Map each CHAR VNode to its rendered text node
        // and format parents if any
        this._currentCharNodes.forEach((vNode: VNode): void => {
            this._setMap(textNode, vNode);
            if (formatTags.indexOf(parent['tagName']) !== -1) {
                this._setMap(parent, vNode);
            }
        });
        this._currentCharNodes = [];
        this._lastCreatedNode = textNode;
    }
    /**
     * Map an DOM Element/Node to a VNode in `vDocument.domMap`.
     *
     * @param element
     * @param vNode
     */
    _setMap(element: Element | Node, vNode: VNode): void {
        if (this.vDocument.domMap.has(element)) {
            const matches = this.vDocument.domMap.get(element);
            if (!matches.some((match: VNode): boolean => match.id === vNode.id)) {
                matches.push(vNode);
            }
        } else {
            this.vDocument.domMap.set(element, [vNode]);
        }
    }
}
