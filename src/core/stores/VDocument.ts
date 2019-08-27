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
            let parsedChild: VNode = this._parseOne(child);
            parsedNodes.push(parsedChild);
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
            case undefined:
                return VNodeType.CHAR;
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
    _parseOne (node: Element): VNode {
        let parent: VNode = new VNode(this._getNodeType(node));
        let children: Element [] = utils._collectionToArray(node.childNodes);
        children.forEach(child => {
            let parsedChild: VNode = this._parseOne(child);
            parent.append(parsedChild)
        });
        return parent;
    }
}
