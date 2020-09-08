import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import JWEditor from '../../core/src/JWEditor';

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
 * Return true if the node has the `contentEditable` attribute.
 *
 * @param node
 */
export function hasContentEditable(node: AbstractNode): boolean {
    return node.modifiers.find(Attributes)?.has('contentEditable') || false;
}
/**
 * Return true if the node has the `contentEditable` attribute set to true. This
 * implies that its children are editable but it is not necessarily itself
 * editable.
 *
 * TODO: unbind from `Attributes`.
 */
export function isContentEditable(node: AbstractNode): boolean {
    const editable = node.modifiers.find(Attributes)?.get('contentEditable');
    return editable === '' || editable?.toLowerCase() === 'true' || false;
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
    const content = isInstanceOf(node, Text) ? node.nodeValue : node.childNodes;
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

/**
 * Check if the editor selection is in a textual context, meaning that it either
 * contains text or is collapsed (in which case text can be inserted).
 */
export function isInTextualContext(editor: JWEditor): boolean {
    const range = editor.selection.range;
    if (range.isCollapsed()) {
        return true;
    } else {
        const end = range.end.nextLeaf();
        let node = range.start.nextLeaf();
        while (node && node !== end) {
            if (node.textContent.length) {
                return true;
            } else {
                node = node.nextLeaf();
            }
        }
        return false;
    }
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

export function isInstanceOf<C extends Constructor<InstanceType<C>>>(
    instance,
    Class: C,
): instance is InstanceType<C> {
    if (instance instanceof Class) return true;
    let proto = Object.getPrototypeOf(instance);
    while (proto) {
        if (proto.constructor.name === Class.name) return true;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
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
