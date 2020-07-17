import { VNode, RelativePosition, Predicate, Typeguard, isLeaf } from './VNode';
import { Constructor, nodeLength } from '../../../utils/src/utils';
import { ContainerNode } from './ContainerNode';
import { AtomicNode } from './AtomicNode';
import { Modifiers } from '../Modifiers';
import { EventMixin } from '../../../utils/src/EventMixin';
import { Modifier } from '../Modifier';
import { markAsDiffRoot } from '../Memory/Memory';

export interface AbstractNodeParams {
    modifiers?: Modifiers | Array<Modifier | Constructor<Modifier>>;
}

/**
 * Replace this VNode with the given VNode.
 *
 * @param node
 */
export function replaceWith(current: AbstractNode, node: VNode): void {
    beforeNodeTemp(current, node);
    current.mergeWith(node);
}

let id = 0;
export abstract class AbstractNode extends EventMixin {
    readonly id = id;
    editable = true;
    tangible = true;
    breakable = true;
    parent: VNode;
    modifiers = new Modifiers();
    childVNodes: VNode[];
    /**
     * Return whether the given predicate is a constructor of a VNode class.
     *
     * @param predicate The predicate to check.
     */
    static isConstructor(
        predicate: Predicate,
    ): predicate is Constructor<ContainerNode> | Constructor<AtomicNode> {
        return predicate.prototype instanceof AbstractNode;
    }

    constructor(params?: AbstractNodeParams) {
        super();
        id++;
        if (params?.modifiers) {
            if (params.modifiers instanceof Modifiers) {
                this.modifiers = params.modifiers;
            } else {
                this.modifiers.append(...params.modifiers);
            }
        }
        markAsDiffRoot(this);
    }

    get name(): string {
        return this.constructor.name;
    }
    /**
     * Return the text content of this node.
     */
    get textContent(): string {
        return this.children()
            .map(child => child.textContent)
            .join('');
    }
    /**
     * @override
     */
    toString(): string {
        return this.name;
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
    locate(domNode: Node, offset: number): [this, RelativePosition] {
        // Position `BEFORE` is preferred over `AFTER`, unless the offset
        // overflows the children list, in which case `AFTER` is needed.
        let position = RelativePosition.BEFORE;
        const domNodeLength = nodeLength(domNode);
        if (domNodeLength && offset >= domNodeLength) {
            position = RelativePosition.AFTER;
        }
        return [this, position];
    }

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(params?: {}): this {
        const clone = new this.constructor(params);
        clone.modifiers = this.modifiers.clone();
        return clone;
    }

    //--------------------------------------------------------------------------
    // Properties
    //--------------------------------------------------------------------------

    /**
     * Return the length of this VNode.
     */
    get length(): number {
        return this.children().length;
    }

    //--------------------------------------------------------------------------
    // Browsing children. To be implemented by the concrete subclass.
    //--------------------------------------------------------------------------

    /**
     * Return the children of this VNode which satisfy the given predicate.
     */
    abstract children<T extends VNode>(predicate?: Predicate<T>): T[];
    abstract children(predicate?: Predicate): VNode[];
    /**
     * Return true if this VNode has children.
     */
    abstract hasChildren(): boolean;
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
    abstract nthChild(n: number): VNode;
    /**
     * Return the first child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first child of this VNode.
     *
     * @param [predicate]
     */
    abstract firstChild<T extends VNode>(predicate?: Predicate<T>): T;
    abstract firstChild(predicate?: Predicate): VNode;
    /**
     * Return the last child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last child of this VNode.
     *
     * @param [predicate]
     */
    abstract lastChild<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastChild(predicate?: Predicate): VNode;
    /**
     * Return the first leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract firstLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    abstract firstLeaf(predicate?: Predicate): VNode;
    /**
     * Return the last leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract lastLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastLeaf(predicate?: Predicate): VNode;
    /**
     * Return all descendants of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    abstract descendants<T extends VNode>(predicate?: Predicate<T>): T[];
    abstract descendants(predicate?: Predicate): VNode[];
    /**
     * Return the first descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the first descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract firstDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    abstract firstDescendant(predicate?: Predicate): VNode;
    /**
     * Return the last descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the last descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract lastDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastDescendant(predicate?: Predicate): VNode;

    //--------------------------------------------------------------------------
    // Updating children. To be implemented by the concrete subclass.
    //--------------------------------------------------------------------------

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
     * Remove the given child from this VNode.
     *
     * @param child
     */
    abstract removeChild(child: VNode): void;
    /**
     * Remove all children of this VNode.
     */
    abstract empty(): void;
    /**
     * Unwrap this node by moving its children before it then removing it.
     */
    abstract unwrap(): void;
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

    //--------------------------------------------------------------------------
    // Events.
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    async trigger<A>(eventName: string, args?: A): Promise<void> {
        super.trigger(eventName, args);
        if (this.parent) {
            await this.parent.trigger(eventName, args);
        }
    }

    //--------------------------------------------------------------------------
    // Private.
    //--------------------------------------------------------------------------

    /**
     * Return a convenient string representation of this node and its
     * descendants.
     *
     * @param __repr
     * @param level
     */
    _repr(__repr = '', level = 0): string {
        __repr += Array(level * 4 + 1).join(' ') + this.name + ' (' + this.id + ')' + '\n';
        this.childVNodes.forEach(child => {
            __repr = child._repr(__repr, level + 1);
        });
        return __repr;
    }
}
export interface AbstractNode {
    constructor: new <T extends Constructor<VNode>>(...args: ConstructorParameters<T>) => this;
}

/**
 * Return whether this node is an instance of the given VNode class.
 *
 * @param predicate The subclass of VNode to test this node against.
 */
export function isNodePredicate<T extends VNode>(
    node: VNode,
    predicate: Constructor<T> | Typeguard<T>,
): node is T;
export function isNodePredicate(node: VNode, predicate: Predicate): false;
export function isNodePredicate(node: VNode, predicate: Predicate): boolean {
    if (AbstractNode.isConstructor(predicate)) {
        return node instanceof predicate;
    } else {
        return predicate(node as VNode);
    }
}
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
export function testNodePredicate(node: AbstractNode, predicate?: Predicate): boolean {
    if (!predicate) {
        return true;
    } else if (AbstractNode.isConstructor(predicate)) {
        return node instanceof predicate;
    } else {
        return predicate(node as VNode);
    }
}

/**
 * Return true if this VNode comes before the given VNode in the pre-order
 * traversal.
 *
 * @param vNode
 */
export function isBeforeNode(node: AbstractNode, vNode: VNode): boolean {
    const thisPath = [node as VNode, ...ancestorsNodesTemp(node)];
    const nodePath = [vNode, ...ancestorsNodesTemp(vNode)];
    // Find the last distinct ancestors in the path to the root.
    let thisAncestor: VNode;
    let nodeAncestor: VNode;
    do {
        thisAncestor = thisPath.pop();
        nodeAncestor = nodePath.pop();
    } while (thisAncestor && nodeAncestor && thisAncestor === nodeAncestor);

    if (thisAncestor && nodeAncestor) {
        const thisParent = thisAncestor.parent;
        const nodeParent = nodeAncestor.parent;
        if (thisParent && thisParent === nodeParent) {
            // Compare the indices of both ancestors in their shared parent.
            const thisIndex = thisParent.childVNodes.indexOf(thisAncestor);
            const nodeIndex = nodeParent.childVNodes.indexOf(nodeAncestor);
            return thisIndex < nodeIndex;
        } else {
            // The very first ancestor of both nodes are different so
            // they actually come from two different trees altogether.
            return false;
        }
    } else {
        // One of the nodes was in the ancestors path of the other.
        return !thisAncestor && !!nodeAncestor;
    }
}

/**
 * Return true if this VNode comes after the given VNode in the pre-order
 * traversal.
 *
 * @param vNode
 */
export function isAfterNode(fromNode: VNode, vNode: VNode): boolean {
    return isBeforeNode(vNode, fromNode as VNode);
}

/**
 * Return the closest node from this node that matches the given predicate.
 * Start with this node then go up the ancestors tree until finding a match.
 *
 * @param predicate
 */
export function closestNode<T extends VNode>(node: VNode, predicate: Predicate<T>): T;
export function closestNode(node: VNode, predicate: Predicate): VNode;
export function closestNode(node: VNode, predicate: Predicate): VNode {
    if (testNodePredicate(node, predicate)) {
        return node as VNode;
    } else {
        return ancestorNodeTemp(node, predicate);
    }
}

//--------------------------------------------------------------------------
// Browsing ancestors and siblings.
//--------------------------------------------------------------------------

/**
 * Return the first ancestor of this VNode that satisfies the given
 * predicate.
 *
 * @param [predicate]
 */
export function ancestorNodeTemp<T extends VNode>(node: AbstractNode, predicate?: Predicate<T>): T;
export function ancestorNodeTemp(node: AbstractNode, predicate?: Predicate): VNode;
export function ancestorNodeTemp(node: AbstractNode, predicate?: Predicate): VNode {
    let ancestor = node.parent;
    while (ancestor && !testNodePredicate(ancestor, predicate)) {
        ancestor = ancestor.parent;
    }
    return ancestor;
}

/**
 * Return all ancestors of the current node that satisfy the given
 * predicate. If no predicate is given return all the ancestors of the
 * current node.
 *
 * @param [predicate]
 */
export function ancestorsNodesTemp<T extends VNode>(
    node: AbstractNode,
    predicate?: Predicate<T>,
): T[];
export function ancestorsNodesTemp(node: AbstractNode, predicate?: Predicate): VNode[];
export function ancestorsNodesTemp(node: AbstractNode, predicate?: Predicate): VNode[] {
    const ancestors: VNode[] = [];
    let parent = node.parent;
    while (parent) {
        if (testNodePredicate(parent, predicate)) {
            ancestors.push(parent);
        }
        parent = parent.parent;
    }
    return ancestors;
}

/**
 * Return the lowest common ancestor between this VNode and the given one.
 *
 * @param node
 */
export function commonAncestorNodesTemp<T extends VNode>(
    currentNode: AbstractNode,
    node: VNode,
    predicate?: Predicate<T>,
): T;
export function commonAncestorNodesTemp(
    currentNode: AbstractNode,
    node: VNode,
    predicate?: Predicate,
): VNode;
export function commonAncestorNodesTemp(
    currentNode: AbstractNode,
    node: VNode,
    predicate?: Predicate,
): VNode {
    if (!currentNode.parent) {
        return;
    } else if (
        currentNode.parent === node.parent &&
        testNodePredicate(currentNode.parent, predicate)
    ) {
        return currentNode.parent;
    }
    const thisPath = [currentNode as VNode, ...ancestorsNodesTemp(currentNode, predicate)];
    const nodePath = [node, ...ancestorsNodesTemp(node, predicate)];
    let commonAncestor: VNode;
    while (thisPath[thisPath.length - 1] === nodePath.pop()) {
        commonAncestor = thisPath.pop();
    }
    return commonAncestor;
}
/**
 * Return the siblings of this VNode which satisfy the given predicate.
 *
 * @param [predicate]
 */
export function siblingsNodesTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T[];
export function siblingsNodesTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[];
export function siblingsNodesTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[] {
    const siblings: VNode[] = [];
    let sibling: VNode = previousSiblingNodeTemp(currentNode);
    while (sibling) {
        if (testNodePredicate(sibling, predicate)) {
            siblings.unshift(sibling);
        }
        sibling = previousSiblingNodeTemp(sibling);
    }
    sibling = nextSiblingNodeTemp(currentNode);
    while (sibling) {
        if (testNodePredicate(sibling, predicate)) {
            siblings.push(sibling);
        }
        sibling = nextSiblingNodeTemp(sibling);
    }
    return siblings;
}
/**
 * Return the nodes adjacent to this VNode that satisfy the given predicate.
 */
export function adjacentsNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T[];
export function adjacentsNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[];
export function adjacentsNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[] {
    const adjacents: VNode[] = [];
    let sibling: VNode = previousSiblingNodeTemp(currentNode);
    while (sibling && testNodePredicate(sibling, predicate)) {
        adjacents.unshift(sibling);
        sibling = previousSiblingNodeTemp(sibling);
    }
    sibling = nextSiblingNodeTemp(currentNode);
    while (sibling && testNodePredicate(sibling, predicate)) {
        adjacents.push(sibling);
        sibling = nextSiblingNodeTemp(sibling);
    }
    return adjacents;
}

/**
 * Return the previous sibling of this VNode that satisfies the predicate.
 * If no predicate is given, return the previous sibling of this VNode.
 *
 * @param [predicate]
 */
export function previousSiblingNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function previousSiblingNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function previousSiblingNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    if (!currentNode.parent) return;
    const index = currentNode.parent.childVNodes.indexOf(currentNode as VNode);
    let sibling = currentNode.parent.childVNodes[index - 1];
    // Skip ignored siblings and those failing the predicate test.
    while (sibling && !(sibling.tangible && testNodePredicate(sibling, predicate))) {
        sibling = previousSiblingNodeTemp(sibling);
    }
    return sibling;
}
/**
 * Return the next sibling of this VNode that satisfies the given predicate.
 * If no predicate is given, return the next sibling of this VNode.
 *
 * @param [predicate]
 */
export function nextSiblingNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function nextSiblingNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function nextSiblingNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    if (!currentNode.parent) return;
    const index = currentNode.parent.childVNodes.indexOf(currentNode as VNode);
    let sibling = currentNode.parent.childVNodes[index + 1];
    // Skip ignored siblings and those failing the predicate test.
    while (sibling && !(sibling.tangible && testNodePredicate(sibling, predicate))) {
        sibling = nextSiblingNodeTemp(sibling);
    }
    return sibling;
}

/**
 * Return the previous node in a depth-first pre-order traversal of the
 * tree that satisfies the given predicate. If no predicate is given return
 * the previous node in a depth-first pre-order traversal of the tree.
 *
 * @param [predicate]
 */
export function previousNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function previousNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function previousNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    let previous = previousSiblingNodeTemp(currentNode);
    if (previous) {
        // The previous node is the last leaf of the previous sibling.
        previous = previous.lastLeaf();
    } else {
        // If it has no previous sibling then climb up to the parent.
        previous = currentNode.parent;
    }
    while (previous && !testNodePredicate(previous, predicate)) {
        previous = previousNodeTemp(previous);
    }
    return previous;
}

/**
 * Return the next node in a depth-first pre-order traversal of the tree
 * that satisfies the given predicate. If no predicate is given return the
 * next node in a depth-first pre-order traversal of the tree.
 *
 * @param [predicate]
 */
export function nextNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function nextNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function nextNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    // The node after node is its first child.
    let next = currentNode.firstChild();
    if (!next) {
        // If it has no children then it is its next sibling.
        next = nextSiblingNodeTemp(currentNode);
    }
    if (!next) {
        // If it has no siblings either then climb up to the closest parent
        // which has a next sibiling.
        let ancestor = currentNode.parent;
        while (ancestor && !nextSiblingNodeTemp(ancestor)) {
            ancestor = ancestor.parent;
        }
        next = ancestor && nextSiblingNodeTemp(ancestor);
    }
    while (next && !testNodePredicate(next, predicate)) {
        next = nextNodeTemp(next);
    }
    return next;
}

/**
 * Return the previous leaf in a depth-first pre-order traversal of the
 * tree that satisfies the given predicate. If no predicate is given return
 * the previous leaf in a depth-first pre-order traversal of the tree.
 *
 * @param [predicate]
 */
export function previousLeafNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function previousLeafNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function previousLeafNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    return previousNodeTemp(currentNode, (node: VNode): boolean => {
        return isLeaf(node) && testNodePredicate(node, predicate);
    });
}

/**
 * Return the next leaf in a depth-first pre-order traversal of the tree
 * that satisfies the given predicate. If no predicate is given return the
 * next leaf in a depth-first pre-order traversal of the tree.
 *
 * @param [predicate]
 */
export function nextLeafNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T;
export function nextLeafNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode;
export function nextLeafNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode {
    return nextNodeTemp(currentNode, (node: VNode): boolean => {
        return isLeaf(node) && testNodePredicate(node, predicate);
    });
}

/**
 * Return all previous siblings of the current node that satisfy the given
 * predicate. If no predicate is given return all the previous siblings of
 * the current node.
 *
 * @param [predicate]
 */
export function previousSiblingsNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T[];
export function previousSiblingsNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[];
export function previousSiblingsNodeTemp(
    currentNode: AbstractNode,
    predicate?: Predicate,
): VNode[] {
    const previousSiblings: VNode[] = [];
    let sibling = previousSiblingNodeTemp(currentNode);
    while (sibling) {
        if (testNodePredicate(sibling, predicate)) {
            previousSiblings.push(sibling);
        }
        sibling = previousSiblingNodeTemp(sibling);
    }
    return previousSiblings;
}

/**
 * Return all next siblings of the current node that satisfy the given
 * predicate. If no predicate is given return all the next siblings of the
 * current node.
 *
 * @param [predicate]
 */
export function nextSiblingsNodeTemp<T extends VNode>(
    currentNode: AbstractNode,
    predicate?: Predicate<T>,
): T[];
export function nextSiblingsNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[];
export function nextSiblingsNodeTemp(currentNode: AbstractNode, predicate?: Predicate): VNode[] {
    const nextSiblings: VNode[] = [];
    let sibling = nextSiblingNodeTemp(currentNode);
    while (sibling) {
        if (testNodePredicate(sibling, predicate)) {
            nextSiblings.push(sibling);
        }
        sibling = nextSiblingNodeTemp(sibling);
    }
    return nextSiblings;
}

//--------------------------------------------------------------------------
// Updating
//--------------------------------------------------------------------------

/**
 * Insert the given VNode before this VNode.
 *
 * @param node
 */
export function beforeNodeTemp(currentNode: AbstractNode, node: VNode): void {
    if (!currentNode.parent) {
        throw 'Cannot insert a VNode before a VNode with no parent.';
    }
    currentNode.parent.insertBefore(node, currentNode as VNode);
}
/**
 * Insert the given VNode after this VNode.
 *
 * @param node
 */
export function afterNodeTemp(currentNode: AbstractNode, node: VNode): void {
    if (!currentNode.parent) {
        throw 'Cannot insert a VNode after a VNode with no parent.';
    }
    currentNode.parent.insertAfter(node, currentNode as VNode);
}
/**
 * Wrap this node in the given node by inserting the given node at this
 * node's position in its parent and appending this node to the given node.
 *
 * @param node
 */
export function wrapNodeTemp(currentNode: AbstractNode, node: VNode): void {
    beforeNodeTemp(currentNode, node);
    node.append(currentNode as VNode);
}
/**
 * Remove this node.
 */
export function removeNodeTemp(currentNode: AbstractNode): void {
    if (currentNode.parent) {
        currentNode.parent.removeChild(currentNode as VNode);
    }
}
/**
 * Remove this node in forward direction. (e.g. `Delete` key)
 */
export function removeForwardNodeTemp(currentNode: AbstractNode): void {
    removeNodeTemp(currentNode);
}
/**
 * Remove this node in backward direction. (e.g. `Backspace` key)
 */
export function removeBackwardNodeTemp(currentNode: AbstractNode): void {
    removeNodeTemp(currentNode);
}
