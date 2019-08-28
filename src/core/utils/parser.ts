import { VNode, VNodeType } from '../stores/VNode';
import utils from './utils';

const _getNodeType = (node: Element): VNodeType => {
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
