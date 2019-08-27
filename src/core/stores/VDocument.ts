import { VNode, VNodeType } from './VNode'
import utils from '../utils/utils';

export default class VDocument {
    _root: VNode;

    constructor (startValue?: DocumentFragment) {
        this._root = new VNode(VNodeType.ROOT);
        if (startValue) {
            this.setContents(startValue);
        }
        console.log(this.contents);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get the contents of the VDocument (its root VNode).
     */
    get contents (): VNode {
        return this._root;
    }
    /**
     * Parse a DOM fragment or its representation as a string.
     */
    parse (fragment: DocumentFragment): VNode [] {
        let parsedNodes: VNode [] = [];
        const contents: NodeListOf<ChildNode> = fragment.childNodes;
        const children: Element [] = utils._collectionToArray(contents);
        children.forEach(child => {
            let parsedChildren: VNode [] = this._parseOne(child);
            parsedNodes = parsedNodes.concat(parsedChildren);
        });
        return parsedNodes;
    }
    /**
     * Set the contents of the VDocument.
     */
    setContents (fragment: DocumentFragment) {
        const parsedNodes: VNode [] = this.parse(fragment);
        while (this._root.children.length) {
            this._root.removeChild(0);
        }
        parsedNodes.forEach(parsedNode => {
            this._root.append(parsedNode);
        });
        return this._root;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _getNodeType (node: Element): VNodeType {
        switch (node.tagName) {
            case 'P':
                return VNodeType.PARAGRAPH;
            case 'H1':
            case 'H2':
            case 'H3':
            case 'H4':
            case 'H5':
            case 'H6':
                return VNodeType.HEADER;
        }
    }
    /**
     * Parse a DOM fragment or its representation as a string.
     */
    _parseOne (node: Element): VNode [] {
        let parsedNode: VNode;
        if (!node.tagName) { // node is a textNode
            let parsedNodes: VNode [] = [];
            for (let i = 0; i < node.textContent.length; i++) {
                let char: string = node.textContent.charAt(i);
                parsedNode = new VNode(VNodeType.CHAR, char);
                parsedNodes.push(parsedNode);
            }
            return parsedNodes;
        }
        parsedNode = new VNode(this._getNodeType(node));
        let children: Element [] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            let parsedChildren: VNode [] = this._parseOne(child);
            parsedChildren.forEach(parsedChild => {
                parsedNode.append(parsedChild);
            });
        });
        return [parsedNode];
    }
}
