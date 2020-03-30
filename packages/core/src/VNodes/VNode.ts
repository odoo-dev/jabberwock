import { Constructor } from '../../../utils/src/utils';
import { ContainerNode } from './ContainerNode';
import { AtomicNode } from './AtomicNode';
import { AbstractNode } from './AbstractNode';

export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}

export type VNode = AbstractNode & (ContainerNode | AtomicNode);

export type Typeguard<T extends VNode> = (node: VNode) => node is T;
export type Predicate<T = VNode | boolean> = T extends VNode
    ? Constructor<T> | Typeguard<T>
    : (node: VNode) => boolean;

export type Point = [VNode, RelativePosition];

/**
 * Return true if the given node is a leaf in the VDocument, that is a node that
 * has no children.
 *
 * @param node node to check
 */
export function isLeaf(node: VNode): boolean {
    return !node.hasChildren();
}
