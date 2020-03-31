import { VNode } from '../../core/src/VNodes/VNode';
import { Format } from '../../plugin-inline/src/Format';

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

/**
 * Get the target VNode or Format's style attribute as a record of style name to
 * style value.
 *
 * @param target
 */
export function getStyles(target: VNode | Format): Record<string, string> {
    const stylesArray = ((target.attributes.style as string) || '')
        .split(';')
        .map(style => style.trim())
        .filter(style => style.length);
    const styles: Record<string, string> = {};
    stylesArray.reduce((accumulator, value) => {
        const [key, v] = value.split(':');
        styles[key.trim()] = v.trim();
        return accumulator;
    }, styles);
    return styles;
}

/**
 * Set the target VNode or Format's style attribute from a record of style name
 * to style value.
 *
 * @param target
 * @param styles
 */
export function setStyles(target: VNode | Format, styles: Record<string, string>): void {
    const stylesArray: string[] = [];
    for (const key of Object.keys(styles)) {
        stylesArray.push([key, styles[key]].join(': '));
    }
    if (stylesArray.length) {
        target.attributes.style = stylesArray.join('; ') + ';';
    } else {
        delete target.attributes.style;
    }
}

/**
 * Get the value of the given style name from the target VNode or Format's style
 * attribute.
 *
 * @param target
 * @param styleName
 */
export function getStyle(target: VNode | Format, styleName: string): string {
    return getStyles(target)[styleName];
}

/**
 * Set the target VNode or Format's style attribute of the given name to the
 * given value.
 *
 * @param target
 * @param styleName
 * @param styleValue
 */
export function setStyle(target: VNode | Format, styleName: string, styleValue: string): void {
    const styles = getStyles(target);
    styles[styleName] = styleValue;
    setStyles(target, styles);
}

/**
 * Remove the given style from the target VNode or Format's style attribute.
 *
 * @param target
 * @param styleName
 */
export function removeStyle(target: VNode | Format, styleName: string): void {
    const styles = getStyles(target);
    delete styles[styleName];
    setStyles(target, styles);
}
