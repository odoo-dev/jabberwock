export type Constructor<T> = new (...args) => T;

/**
 * Return whether the given constructor is a constructor of given superClass.
 *
 * @param constructor
 * @param superClass
 */
export function isConstructor<T extends Function>(constructor, superClass: T): constructor is T {
    return constructor.prototype instanceof superClass || constructor === superClass;
}
/**
 * Return true if object a is deep equal to object b, false otherwise.
 *
 * @param a
 * @param b
 */
export function deepEqualObjects(a: object, b: object): boolean {
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length) return false;
    for (const key of aKeys) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
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

/**
 * Return the uppercase name of the given DOM node.
 *
 * @param node
 */
export function nodeName(node: Node): string {
    return node.nodeName.toUpperCase();
}
