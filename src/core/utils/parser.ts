import { VNode, VNodeType } from '../stores/VNode';
import utils from './utils';

const parser = {
    /**
     * Parse a DOM fragment or its representation as a string.
     */
    parse: (fragment: DocumentFragment): VNode [] => {
        let parsedNodes: VNode [] = [];
        const contents: NodeListOf<ChildNode> = fragment.childNodes;
        const children: Element [] = utils._collectionToArray(contents);
        children.forEach(child => {
            let parsedChildren: VNode [] = this._parseOne(child);
            parsedNodes = parsedNodes.concat(parsedChildren);
        });
        return parsedNodes;
    },
    _getNodeType: (node: Element): VNodeType => {
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
    },
    /**
     * Parse a DOM fragment or its representation as a string.
     */
    _parseOne: (node: Element): VNode [] => {
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
};

export default parser;
