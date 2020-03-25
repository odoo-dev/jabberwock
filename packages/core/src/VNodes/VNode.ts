import { Constructor } from '../../../utils/src/utils';

export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}

export type Typeguard<T extends VNode> = (node: VNode) => node is T;
export type Predicate<T = boolean> = T extends VNode
    ? Constructor<T> | Typeguard<T>
    : (node: VNode) => boolean;

export type Point = [VNode, RelativePosition];

export type TNode = VNode & { tangible: true };

let id = 0;
interface VNodeConstructor {
    new <T extends Constructor<VNode>>(...args: ConstructorParameters<T>): this;
    atomic: boolean;
}
export interface VNode {
    constructor: VNodeConstructor & this;
}
export abstract class VNode {
    readonly id = id;
    tangible: boolean;
    breakable: boolean;
    parent: VNode;
    attributes: Record<string, string | Record<string, string>>;
    childVNodes: VNode[];
    name: string;
    /**
     * A node is atomic when it is not allowed to have children in the
     * abstraction. Its real-life children should be ignored in the abstraction.
     * This getter allows us to call `this.atomic` on the extensions of `VNode`
     * while declaring the `atomic` property in a static way.
     */
    readonly atomic: boolean;

    /**
     * Return whether the given predicate is a constructor of a VNode class.
     *
     * @param predicate The predicate to check.
     */
    static isConstructor<T extends VNode>(
        predicate: Constructor<T> | Predicate | typeof VNode,
    ): predicate is Constructor<T> {
        return predicate.prototype instanceof VNode || predicate === VNode;
    }

    constructor() {
        id++;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Transform the given DOM location into its VDocument counterpart.
     *
     * @param domNode DOM node corresponding to this VNode
     * @param offset The offset of the location in the given domNode
     */
    abstract locate(domNode: Node, offset: number): [VNode, RelativePosition];
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    abstract clone(): this;

    //--------------------------------------------------------------------------
    // Properties
    //--------------------------------------------------------------------------

    /**
     * Return the length of this VNode.
     */
    length: number;
    /**
     * Return true if this VNode has children.
     */
    abstract hasChildren(): boolean;
    /**
     * Return true if this VNode comes before the given VNode in the pre-order
     * traversal.
     *
     * @param vNode
     */
    abstract isBefore(vNode: VNode): boolean;
    /**
     * Return true if this VNode comes after the given VNode in the pre-order
     * traversal.
     *
     * @param vNode
     */
    abstract isAfter(vNode: VNode): boolean;
    /**
     * Return whether this node is an instance of the given VNode class.
     *
     * @param predicate The subclass of VNode to test this node against.
     */
    abstract is<T extends VNode>(predicate: Constructor<T> | Typeguard<T>): this is T;
    /**
     * Test this node against the given predicate.
     *
     * If the predicate is falsy, return true. If the predicate is a constructor
     * of a VNode class, return whether this node is an instance of that class.
     * If the predicate is a standard function, return the result of this
     * function when called with the node as parameter.
     *
     *
     * @param predicate The predicate to test this node against.
     */
    abstract test<T extends VNode>(predicate?: Constructor<T> | Predicate): boolean;

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

    /**
     * Return the children of this VNode which satisfy the given predicate.
     */
    abstract children<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract children<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return the nth child of this node. The given `n` argument is the 1-based
     * index of the position of the child inside this node, excluding markers.
     *
     * Examples:
     * nthChild(1) returns the first (1st) child.
     * nthChild(2) returns the second (2nd) child.
     * nthChild(3) returns the second (3rd) child.
     * nthChild(4) returns the second (4th) child.
     * ...
     *
     * @param n
     */
    abstract nthChild(n: number): TNode;
    /**
     * Return the siblings of this VNode which satisfy the given predicate.
     */
    abstract siblings<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract siblings<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return the nodes adjacent to this VNode that satisfy the given predicate.
     */
    abstract adjacents<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract adjacents<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return the first ancestor of this VNode that satisfies the given
     * predicate.
     *
     * @param [predicate]
     */
    abstract ancestor<T extends TNode>(predicate?: Predicate<T>): T;
    abstract ancestor<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the first child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first child of this VNode.
     *
     * @param [predicate]
     */
    abstract firstChild<T extends TNode>(predicate?: Predicate<T>): T;
    abstract firstChild<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the last child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last child of this VNode.
     *
     * @param [predicate]
     */
    abstract lastChild<T extends TNode>(predicate?: Predicate<T>): T;
    abstract lastChild<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the first leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract firstLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    abstract firstLeaf<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the last leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract lastLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    abstract lastLeaf<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the first descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the first descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract firstDescendant<T extends TNode>(predicate?: Predicate<T>): T;
    abstract firstDescendant<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the last descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the last descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract lastDescendant<T extends TNode>(predicate?: Predicate<T>): T;
    abstract lastDescendant<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the previous sibling of this VNode that satisfies the predicate.
     * If no predicate is given, return the previous sibling of this VNode.
     *
     * @param [predicate]
     */
    abstract previousSibling<T extends TNode>(predicate?: Predicate<T>): T;
    abstract previousSibling<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the next sibling of this VNode that satisfies the given predicate.
     * If no predicate is given, return the next sibling of this VNode.
     *
     * @param [predicate]
     */
    abstract nextSibling<T extends TNode>(predicate?: Predicate<T>): T;
    abstract nextSibling<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the previous node in a depth-first pre-order traversal of the
     * tree that satisfies the given predicate. If no predicate is given return
     * the previous node in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    abstract previous<T extends TNode>(predicate?: Predicate<T>): T;
    abstract previous<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the next node in a depth-first pre-order traversal of the tree
     * that satisfies the given predicate. If no predicate is given return the
     * next node in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    abstract next<T extends TNode>(predicate?: Predicate<T>): T;
    abstract next<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the previous leaf in a depth-first pre-order traversal of the
     * tree that satisfies the given predicate. If no predicate is given return
     * the previous leaf in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    abstract previousLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    abstract previousLeaf<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return the next leaf in a depth-first pre-order traversal of the tree
     * that satisfies the given predicate. If no predicate is given return the
     * next leaf in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    abstract nextLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    abstract nextLeaf<T>(predicate?: Predicate<T>): TNode;
    /**
     * Return all previous siblings of the current node that satisfy the given
     * predicate. If no predicate is given return all the previous siblings of
     * the current node.
     *
     * @param [predicate]
     */
    abstract previousSiblings<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract previousSiblings<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return all next siblings of the current node that satisfy the given
     * predicate. If no predicate is given return all the next siblings of the
     * current node.
     *
     * @param [predicate]
     */
    abstract nextSiblings<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract nextSiblings<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return the closest node from this node that matches the given predicate.
     * Start with this node then go up the ancestors tree until finding a match.
     *
     * @param predicate
     */
    abstract closest<T extends TNode>(predicate: Predicate<T>): T;
    abstract closest<T>(predicate: Predicate<T>): TNode;
    /**
     * Return all ancestors of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    abstract ancestors<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract ancestors<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return all descendants of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    abstract descendants<T extends TNode>(predicate?: Predicate<T>): T[];
    abstract descendants<T>(predicate?: Predicate<T>): TNode[];
    /**
     * Return the lowest common ancestor between this VNode and the given one.
     *
     * @param node
     */
    abstract commonAncestor<T extends TNode>(node: VNode, predicate?: Predicate<T>): T;
    abstract commonAncestor<T>(node: VNode, predicate?: Predicate<T>): TNode;

    //--------------------------------------------------------------------------
    // Updating
    //--------------------------------------------------------------------------

    /**
     * Insert the given VNode before this VNode.
     *
     * @param node
     */
    abstract before(node: VNode): void;
    /**
     * Insert the given VNode after this VNode.
     *
     * @param node
     */
    abstract after(node: VNode): void;
    /**
     * Prepend a child to this node.
     */
    abstract prepend(...children: VNode[]): void;
    /**
     * Append a child to this VNode.
     */
    abstract append(...children: VNode[]): void;
    /**
     * Insert the given node before the given reference (which is a child of
     * this VNode).
     *
     * @param node
     * @param reference
     */
    abstract insertBefore(node: VNode, reference: VNode): void;
    /**
     * Insert the given node after the given reference (a child of this VNode).
     *
     * @param node
     * @param reference
     */
    abstract insertAfter(node: VNode, reference: VNode): void;
    /**
     * Remove all children of this VNode.
     */
    abstract empty(): void;
    /**
     * Remove this node.
     */
    abstract remove(): void;
    /**
     * Remove the given child from this VNode.
     *
     * @param child
     */
    abstract removeChild(child: VNode): void;
    /**
     * Remove this node in forward direction. (e.g. `Delete` key)
     */
    abstract removeForward(): void;
    /**
     * Remove this node in backward direction. (e.g. `Backspace` key)
     */
    abstract removeBackward(): void;
    /**
     * Split this node at the given child, moving it and its next siblings into
     * a duplicate of this VNode that is inserted after the original. Return the
     * duplicated VNode.
     *
     * @param child
     */
    abstract splitAt(child: VNode): this;
    /**
     * Merge this node with the given VNode.
     *
     * @param newContainer the new container for this node's children
     */
    abstract mergeWith(newContainer: VNode): void;
    /**
     * Wrap this node in the given node by inserting the given node at this
     * node's position in its parent and appending this node to the given node.
     *
     * @param node
     */
    abstract wrap(node: VNode): void;
    /**
     * Unwrap this node by moving its children before it then removing it.
     */
    abstract unwrap(): void;

    /**
     * Return a convenient string representation of this node and its
     * descendants.
     *
     */
    abstract repr(): string;
}

/**
 * Return whether the given node is tangible.
 *
 * @param node node to check
 */
export function isTangible(node: VNode): node is TNode {
    return node.tangible;
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
