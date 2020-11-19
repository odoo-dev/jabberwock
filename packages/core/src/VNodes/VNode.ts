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
