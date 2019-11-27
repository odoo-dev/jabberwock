/**
 * Return the deepest child of a given container at a given offset, and its
 * adapted offset.
 *
 * @param container
 * @param offset
 */
export function targetDeepest(container: Node, offset: number): [Node, number] {
    while (container.hasChildNodes()) {
        if (offset >= container.childNodes.length) {
            container = container.lastChild;
            // The new container might be a text node, so considering only
            // the `childNodes` property would be wrong.
            offset = nodeLength(container);
        } else {
            container = container.childNodes[offset];
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
    const isTextNode = node.nodeType === Node.TEXT_NODE;
    const content = isTextNode ? node.nodeValue : node.childNodes;
    return content.length;
}
