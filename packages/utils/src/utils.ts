export let isWithRange = false;

export const utils = {
    /**
     * Convert certain special characters to unicode.
     */
    toUnicode(string: string): string {
        if (string === ' ') {
            return '\u00A0';
        }
        if (string === '\n') {
            return '\u000d';
        }
        if (string === '\t') {
            return '\u0009';
        }
        return string;
    },
    /**
     * Return the length of a DOM Node.
     *
     * @param node
     */
    nodeLength(node: Node): number {
        const isTextNode = node.nodeType === Node.TEXT_NODE;
        const content = isTextNode ? node.nodeValue : node.childNodes;
        return content.length;
    },
    /**
     * Call a callback on this VNode without ignoring the range nodes.
     *
     * @param callback
     */
    withRange<T>(callback: () => T): T {
        // Record the previous value to allow for nested calls to `withRange`.
        const previousValue = isWithRange;
        isWithRange = true;
        const result = callback();
        isWithRange = previousValue;
        return result;
    },
    /**
     * Take a collection of nodes and return a regular array
     * with the same contents.
     */
    _collectionToArray: (collection: NodeListOf<Node> | HTMLCollection): Node[] => {
        return Array.prototype.slice.call(collection);
    },
};
