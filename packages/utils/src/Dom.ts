import { isInstanceOf } from './utils';

/**
 * Return the deepest child of a given container at a given offset, and its
 * adapted offset.
 *
 * @param container
 * @param offset
 */
export function targetDeepest(container: Node, offset: number): [Node, number] {
    while (
        container.hasChildNodes() ||
        (isInstanceOf(container, Element) && container.shadowRoot?.hasChildNodes())
    ) {
        let childNodes: NodeListOf<ChildNode>;
        if (isInstanceOf(container, Element) && container.shadowRoot) {
            childNodes = container.shadowRoot.childNodes;
        } else {
            childNodes = container.childNodes;
        }
        if (offset >= childNodes.length) {
            container = container.lastChild;
            // The new container might be a text node, so considering only
            // the `childNodes` property would be wrong.
            offset = nodeLength(container);
        } else {
            container = childNodes[offset];
            offset = 0;
        }
    }
    return [container, offset];
}

/**
 * Return the length of a DOM Node.
 *
 * @param node
 */
export function nodeLength(node: Node): number {
    if (isInstanceOf(node, Text)) {
        return node.nodeValue.length;
    } else if (isInstanceOf(node, Element) && node.shadowRoot) {
        return node.shadowRoot.childNodes.length;
    } else {
        return node.childNodes.length;
    }
}
