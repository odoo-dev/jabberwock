import { VNode, VNodeType } from '../stores/VNode.js';
import utils from './utils.js';

const _getNodeType = (node: Element): VNodeType => {
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
};
/**
 * Parse a DOM fragment or its representation as a string.
 */
const _parseOne = (node: Element): VNode [] => {
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
    parsedNode = new VNode(_getNodeType(node));
    let children: Element [] = utils._collectionToArray(node.childNodes);
    children.forEach(child => {
        let parsedChildren: VNode [] = _parseOne(child);
        parsedChildren.forEach(parsedChild => {
            parsedNode.append(parsedChild);
        });
    });
    return [parsedNode];
}
/**
 * Parse a DOM fragment or its representation as a string.
 */
const parse = (fragment: DocumentFragment): VNode [] => {
    let parsedNodes: VNode [] = [];
    const contents: NodeListOf<ChildNode> = fragment.childNodes;
    const children: Element [] = utils._collectionToArray(contents);
    children.forEach(child => {
        let parsedChildren: VNode [] = _parseOne(child);
        parsedNodes = parsedNodes.concat(parsedChildren);
    });
    return parsedNodes;
};

const parser = {
    parse: parse,
    _getNodeType: _getNodeType,
    _parseOne: _parseOne,
};

export default parser;
