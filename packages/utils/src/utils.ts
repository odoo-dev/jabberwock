export type Constructor<T> = new (...args) => T;

/**
 * Return true if the given node is a block-level element, false otherwise.
 *
 * @param node
 */
export function isBlock(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }
    const temporaryElement = document.createElement(node.nodeName);
    document.body.appendChild(temporaryElement);
    const display = window.getComputedStyle(temporaryElement).display;
    document.body.removeChild(temporaryElement);
    return display.includes('block') || display.includes('list');
}

/**
 * Convert certain special characters to unicode.
 */
export function toUnicode(string: string): string {
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

/**
 * Return a duplicate-free version of an array.
 *
 * @param array
 */
export function distinct<T>(array: Array<T>): Array<T> {
    return Array.from(new Set(array));
}
