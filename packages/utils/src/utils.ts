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
        const aValue = a[key];
        const bValue = b[key];
        if (typeof aValue === 'object') {
            if (!deepEqualObjects(aValue, bValue)) {
                return false;
            }
        } else {
            if (aValue !== bValue) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Creates a new array with all sub-array elements concatenated into it.
 */
export function flat<T>(arr: T[][]): T[] {
    return [].concat(...arr);
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

export function getDocument(node: Node): Document | ShadowRoot {
    let root: Document | ShadowRoot;
    while (node && !root) {
        if (node instanceof Document || node instanceof ShadowRoot) {
            root = node;
        } else {
            node = node.parentNode;
        }
    }
    return root || document;
}

// Flattens two union types into a single type with optional values
// i.e. FlattenUnion<{ a: number, c: number } | { b: string, c: number }> = { a?: number, b?: string, c: number }
export type FlattenUnion<T> = {
    [K in keyof UnionToIntersection<T>]: K extends keyof T
        ? T[K] extends {}[]
            ? T[K]
            : T[K] extends object
            ? FlattenUnion<T[K]>
            : T[K]
        : UnionToIntersection<T>[K] | undefined;
};

// Converts a union of two types into an intersection
// i.e. A | B -> A & B
type UnionToIntersection<U> = (U extends {}
  ? (k: U) => void
  : never) extends (k: infer I) => void
    ? I
    : never;
