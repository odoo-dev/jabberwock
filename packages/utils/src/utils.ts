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
     * Take a collection of nodes and return a regular array
     * with the same contents.
     */
    _collectionToArray: (collection: NodeListOf<Node> | HTMLCollection): Node[] => {
        return Array.prototype.slice.call(collection);
    },
};
