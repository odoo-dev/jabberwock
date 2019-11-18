import { VNode, VNodeType } from '../stores/VNode';

export type Predicate = (node: VNode) => boolean;

/**
 * Return a function that is the logical opposite of the given predicate.
 *
 * @param node node to check
 */
export function not(predicate: Predicate): Predicate {
    return (node: VNode): boolean => !predicate(node);
}

/**
 * Return true if the given node is a range node.
 *
 * @param node node to check
 */
export function isRange(node: VNode): boolean {
    return node.type === VNodeType.RANGE_TAIL || node.type === VNodeType.RANGE_HEAD;
}

/**
 * Return true if the given node is a character node.
 *
 * @param node node to check
 */
export function isChar(node: VNode): boolean {
    return node.type === VNodeType.CHAR;
}

/**
 * Return true if the given node is a leaf in the VDocument, that is a node that
 * has no children.
 *
 * @param node node to check
 */
export function isLeaf(node: VNode): boolean {
    return !node.hasChildren();
}
