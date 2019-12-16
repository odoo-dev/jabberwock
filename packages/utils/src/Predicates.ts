import { VNode } from '../../core/src/VNodes/VNode';

export type Predicate = (node: VNode) => boolean;

/**
 * Return a function that is the logical opposite of the given predicate.
 *
 * @param node node to check
 */
export function not(predicate: Predicate): Predicate {
    return (node: VNode): boolean => !predicate(node);
}

export { isLeaf } from '../../core/src/VNodes/VNode';
export { isMarker } from '../../core/src/VNodes/VNode';
export { isChar } from '../../core/src/VNodes/CharNode';
