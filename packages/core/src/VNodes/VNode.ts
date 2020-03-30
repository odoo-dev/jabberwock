import { Constructor, nodeLength } from '../../../utils/src/utils';
import { ContainerNode } from './ContainerNode';
import { AtomicNode } from './AtomicNode';

export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}

export type VNode = AbstractNode & (ContainerNode | AtomicNode);

export type Typeguard<T extends VNode> = (node: VNode) => node is T;
export type Predicate<T = boolean> = T extends VNode
    ? Constructor<T> | Typeguard<T>
    : (node: VNode) => boolean;

export type Point = [VNode, RelativePosition];

let id = 0;
export abstract class AbstractNode {
    readonly id = id;
    tangible = true;
    breakable = true;
    parent: VNode;
    attributes: Record<string, string | Record<string, string>> = {};
    childVNodes: VNode[];
    /**
     * Return whether the given predicate is a constructor of a VNode class.
     *
     * @param predicate The predicate to check.
     */
    static isConstructor<T extends VNode>(
        predicate: Constructor<T> | Predicate | typeof AbstractNode,
    ): predicate is Constructor<T> {
        return predicate.prototype instanceof AbstractNode || predicate === AbstractNode;
    }

    constructor() {
        id++;
    }

    get name(): string {
        return this.constructor.name;
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
    clone(): this {
        const clone = new this.constructor();
        clone.attributes = { ...this.attributes };
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
    /**
     * Return whether this node is an instance of the given VNode class.
     *
     * @param predicate The subclass of VNode to test this node against.
     */
    is<T extends VNode>(predicate: Constructor<T> | Typeguard<T>): this is T {
        if (AbstractNode.isConstructor(predicate)) {
            return this instanceof predicate;
        } else {
            return predicate(this as VNode);
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
    test<T extends VNode>(predicate?: Constructor<T> | Predicate): boolean {
        if (!predicate) {
            return true;
        } else if (AbstractNode.isConstructor(predicate)) {
            return this.is(predicate);
        } else {
            return predicate(this as VNode);
        }
    }
    /**
     * Return true if this VNode comes before the given VNode in the pre-order
     * traversal.
     *
     * @param vNode
     */
    isBefore(vNode: VNode): boolean {
        const thisPath = [this as VNode, ...this.ancestors()];
        const nodePath = [vNode, ...vNode.ancestors()];
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
    isAfter(vNode: VNode): boolean {
        return vNode.isBefore(this as VNode);
    }

    //--------------------------------------------------------------------------
    // Browsing ancestors and siblings.
    //--------------------------------------------------------------------------

    /**
     * Return the closest node from this node that matches the given predicate.
     * Start with this node then go up the ancestors tree until finding a match.
     *
     * @param predicate
     */
    closest<T extends VNode>(predicate: Predicate<T>): T;
    closest<T>(predicate: Predicate<T>): VNode;
    closest<T>(predicate: Predicate<T>): VNode {
        return this.test(predicate) ? (this as VNode) : this.ancestor(predicate);
    }
    /**
     * Return the first ancestor of this VNode that satisfies the given
     * predicate.
     *
     * @param [predicate]
     */
    ancestor<T extends VNode>(predicate?: Predicate<T>): T;
    ancestor<T>(predicate?: Predicate<T>): VNode;
    ancestor<T>(predicate?: Predicate<T>): VNode {
        let ancestor = this.parent;
        while (ancestor && !ancestor.test(predicate)) {
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
    ancestors<T extends VNode>(predicate?: Predicate<T>): T[];
    ancestors<T>(predicate?: Predicate<T>): VNode[];
    ancestors<T>(predicate?: Predicate<T>): VNode[] {
        const ancestors: VNode[] = [];
        let parent = this.parent;
        while (parent) {
            if (parent.test(predicate)) {
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
    commonAncestor<T extends VNode>(node: VNode, predicate?: Predicate<T>): T;
    commonAncestor<T>(node: VNode, predicate?: Predicate<T>): VNode;
    commonAncestor<T>(node: VNode, predicate?: Predicate<T>): VNode {
        if (!this.parent) {
            return;
        } else if (this.parent === node.parent && this.parent.test(predicate)) {
            return this.parent;
        }
        const thisPath = [this as VNode, ...this.ancestors(predicate)];
        const nodePath = [node, ...node.ancestors(predicate)];
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
    siblings<T extends VNode>(predicate?: Predicate<T>): T[];
    siblings<T>(predicate?: Predicate<T>): VNode[];
    siblings<T>(predicate?: Predicate<T>): VNode[] {
        const siblings: VNode[] = [];
        let sibling: VNode = this.previousSibling();
        while (sibling) {
            if (sibling.test(predicate)) {
                siblings.unshift(sibling);
            }
            sibling = sibling.previousSibling();
        }
        sibling = this.nextSibling();
        while (sibling) {
            if (sibling.test(predicate)) {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling();
        }
        return siblings;
    }
    /**
     * Return the nodes adjacent to this VNode that satisfy the given predicate.
     */
    adjacents<T extends VNode>(predicate?: Predicate<T>): T[];
    adjacents<T>(predicate?: Predicate<T>): VNode[];
    adjacents<T>(predicate?: Predicate<T>): VNode[] {
        const adjacents: VNode[] = [];
        let sibling: VNode = this.previousSibling();
        while (sibling && sibling.test(predicate)) {
            adjacents.unshift(sibling);
            sibling = sibling.previousSibling();
        }
        sibling = this.nextSibling();
        while (sibling && sibling.test(predicate)) {
            adjacents.push(sibling);
            sibling = sibling.nextSibling();
        }
        return adjacents;
    }
    /**
     * Return the previous sibling of this VNode that satisfies the predicate.
     * If no predicate is given, return the previous sibling of this VNode.
     *
     * @param [predicate]
     */
    previousSibling<T extends VNode>(predicate?: Predicate<T>): T;
    previousSibling<T>(predicate?: Predicate<T>): VNode;
    previousSibling<T>(predicate?: Predicate<T>): VNode {
        if (!this.parent) return;
        const index = this.parent.childVNodes.indexOf(this as VNode);
        let sibling = this.parent.childVNodes[index - 1];
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && !(sibling.tangible && sibling.test(predicate))) {
            sibling = sibling.previousSibling();
        }
        return sibling;
    }
    /**
     * Return the next sibling of this VNode that satisfies the given predicate.
     * If no predicate is given, return the next sibling of this VNode.
     *
     * @param [predicate]
     */
    nextSibling<T extends VNode>(predicate?: Predicate<T>): T;
    nextSibling<T>(predicate?: Predicate<T>): VNode;
    nextSibling<T>(predicate?: Predicate<T>): VNode {
        if (!this.parent) return;
        const index = this.parent.childVNodes.indexOf(this as VNode);
        let sibling = this.parent.childVNodes[index + 1];
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && !(sibling.tangible && sibling.test(predicate))) {
            sibling = sibling.nextSibling();
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
    previous<T extends VNode>(predicate?: Predicate<T>): T;
    previous<T>(predicate?: Predicate<T>): VNode;
    previous<T>(predicate?: Predicate<T>): VNode {
        let previous = this.previousSibling();
        if (previous) {
            // The previous node is the last leaf of the previous sibling.
            previous = previous.lastLeaf();
        } else {
            // If it has no previous sibling then climb up to the parent.
            previous = this.parent;
        }
        while (previous && !previous.test(predicate)) {
            previous = previous.previous();
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
    next<T extends VNode>(predicate?: Predicate<T>): T;
    next<T>(predicate?: Predicate<T>): VNode;
    next<T>(predicate?: Predicate<T>): VNode {
        // The node after node is its first child.
        let next = this.firstChild();
        if (!next) {
            // If it has no children then it is its next sibling.
            next = this.nextSibling();
        }
        if (!next) {
            // If it has no siblings either then climb up to the closest parent
            // which has a next sibiling.
            let ancestor = this.parent;
            while (ancestor && !ancestor.nextSibling()) {
                ancestor = ancestor.parent;
            }
            next = ancestor && ancestor.nextSibling();
        }
        while (next && !next.test(predicate)) {
            next = next.next();
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
    previousLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    previousLeaf<T>(predicate?: Predicate<T>): VNode;
    previousLeaf<T>(predicate?: Predicate<T>): VNode {
        return this.previous((node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        });
    }
    /**
     * Return the next leaf in a depth-first pre-order traversal of the tree
     * that satisfies the given predicate. If no predicate is given return the
     * next leaf in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    nextLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    nextLeaf<T>(predicate?: Predicate<T>): VNode;
    nextLeaf<T>(predicate?: Predicate<T>): VNode {
        return this.next((node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        });
    }
    /**
     * Return all previous siblings of the current node that satisfy the given
     * predicate. If no predicate is given return all the previous siblings of
     * the current node.
     *
     * @param [predicate]
     */
    previousSiblings<T extends VNode>(predicate?: Predicate<T>): T[];
    previousSiblings<T>(predicate?: Predicate<T>): VNode[];
    previousSiblings<T>(predicate?: Predicate<T>): VNode[] {
        const previousSiblings: VNode[] = [];
        let sibling = this.previousSibling();
        while (sibling) {
            if (sibling.test(predicate)) {
                previousSiblings.push(sibling);
            }
            sibling = sibling.previousSibling();
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
    nextSiblings<T extends VNode>(predicate?: Predicate<T>): T[];
    nextSiblings<T>(predicate?: Predicate<T>): VNode[];
    nextSiblings<T>(predicate?: Predicate<T>): VNode[] {
        const nextSiblings: VNode[] = [];
        let sibling = this.nextSibling();
        while (sibling) {
            if (sibling.test(predicate)) {
                nextSiblings.push(sibling);
            }
            sibling = sibling.nextSibling();
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
    before(node: VNode): void {
        if (!this.parent) {
            throw 'Cannot insert a VNode before a VNode with no parent.';
        }
        this.parent.insertBefore(node, this as VNode);
    }
    /**
     * Insert the given VNode after this VNode.
     *
     * @param node
     */
    after(node: VNode): void {
        if (!this.parent) {
            throw 'Cannot insert a VNode after a VNode with no parent.';
        }
        this.parent.insertAfter(node, this as VNode);
    }
    /**
     * Wrap this node in the given node by inserting the given node at this
     * node's position in its parent and appending this node to the given node.
     *
     * @param node
     */
    wrap(node: VNode): void {
        this.before(node);
        node.append(this as VNode);
    }
    /**
     * Remove this node.
     */
    remove(): void {
        if (this.parent) {
            this.parent.removeChild(this as VNode);
        }
    }
    /**
     * Remove this node in forward direction. (e.g. `Delete` key)
     */
    removeForward(): void {
        this.remove();
    }
    /**
     * Remove this node in backward direction. (e.g. `Backspace` key)
     */
    removeBackward(): void {
        this.remove();
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
    abstract firstChild<T>(predicate?: Predicate<T>): VNode;
    /**
     * Return the last child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last child of this VNode.
     *
     * @param [predicate]
     */
    abstract lastChild<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastChild<T>(predicate?: Predicate<T>): VNode;
    /**
     * Return the first leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract firstLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    abstract firstLeaf<T>(predicate?: Predicate<T>): VNode;
    /**
     * Return the last leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last leaf of this VNode.
     *
     * @param [predicate]
     */
    abstract lastLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastLeaf<T>(predicate?: Predicate<T>): VNode;
    /**
     * Return all descendants of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    abstract descendants<T extends VNode>(predicate?: Predicate<T>): T[];
    abstract descendants<T>(predicate?: Predicate<T>): VNode[];
    /**
     * Return the first descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the first descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract firstDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    abstract firstDescendant<T>(predicate?: Predicate<T>): VNode;
    /**
     * Return the last descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the last descendant of this VNode.
     *
     * @param [predicate]
     */
    abstract lastDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    abstract lastDescendant<T>(predicate?: Predicate<T>): VNode;

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
 * Return true if the given node is a leaf in the VDocument, that is a node that
 * has no children.
 *
 * @param node node to check
 */
export function isLeaf(node: VNode): boolean {
    return !node.hasChildren();
}
