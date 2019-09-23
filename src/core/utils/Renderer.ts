import { VNode, VNodeType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';

let _currentCharNodes: VNode[] = [];
let _currentText = '';

export class Renderer {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    static render(vDocument: VDocument, target: Element): void {
        target.innerHTML = ''; // TO REMOVE: just for trying
        const contents: VNode = vDocument.contents;
        const fragment: DocumentFragment = document.createDocumentFragment();
        this._renderOne(contents, fragment);
        target.appendChild(fragment);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    static _getTagName(vNodeType: VNodeType): string {
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
    static _renderOne(vNode: VNode, parent: Element | DocumentFragment): void {
        const isRoot: boolean = vNode.type === 'ROOT';

        // If the node has a format, render that format node first
        const formatNodes: Element[] = [];
        if (vNode.hasFormat()) {
            Object.keys(vNode.format).forEach((key: string) => {
                if (vNode.format[key] === true) {
                    const format = key === 'italic' ? 'I' : key === 'bold' ? 'B' : 'U';
                    const formatNode = document.createElement(format);
                    parent.appendChild(formatNode);
                    parent = formatNode;
                    formatNodes.push(formatNode);
                }
            });
        }

        // If this is the end of a series of characters, render that text
        if (vNode.type !== 'CHAR' && _currentText.length) {
            this._renderText(parent, _currentCharNodes);
        }

        // Create the element matching this vNode if possible, and append it
        const tagName: string = this._getTagName(vNode.type);
        let createdNode: Element;
        if (!isRoot && tagName) {
            createdNode = document.createElement(tagName);
            parent.appendChild(createdNode);
            parent = createdNode;
        } else if (!isRoot) {
            _currentText += vNode.value;
            _currentCharNodes.push(vNode);
        }

        // Render the children
        vNode.children.forEach((child: VNode): void => {
            this._renderOne(child, parent);
        });

        // Render aggregated text at the end of an element
        if (!vNode.nextSibling && _currentText.length) {
            this._renderText(parent, _currentCharNodes);
        }

        // Remove empty format nodes (due to technical spaces)
        // and ensure proper DOM/VDoc matching
        if (formatNodes.length) {
            formatNodes.forEach((formatNode: Element): void => {
                if (!formatNode.childNodes.length) {
                    formatNode.remove();
                } else {
                    vNode.domMatch = [formatNode];
                }
            });
        } else if (!isRoot) {
            // Ensure proper DOM/VDoc matching
            vNode.domMatch = [parent];
        }
    }
    static _renderText(parent: Element | DocumentFragment, matchNodes: VNode[] = []): void {
        const textNode: Text = document.createTextNode(_currentText);
        parent.appendChild(textNode);
        matchNodes.forEach((vNode: VNode): void => {
            vNode.domMatch = [textNode];
        });
        _currentText = '';
        _currentCharNodes = [];
    }
}
