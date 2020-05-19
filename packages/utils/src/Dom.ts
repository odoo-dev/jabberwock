/**
 * Return the deepest child of a given container at a given offset, and its
 * adapted offset.
 *
 * @param container
 * @param offset
 */
export function targetDeepest(container: Node, offset: number): [Node, number] {
    while (container.hasChildNodes()) {
        let childNodes: NodeListOf<ChildNode>;
        if (container instanceof Element && container.shadowRoot) {
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
    if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.length;
    } else if (node instanceof Element && node.shadowRoot) {
        return node.shadowRoot.childNodes.length;
    } else {
        return node.childNodes.length;
    }
}

export function styleToObject(style: string): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const styleValue of style.split(/\s*;\s*/)) {
        const [key, value] = styleValue.split(/\s*:\s*/, 2);
        if (key) {
            obj[key] = value;
        }
    }
    return obj;
}
