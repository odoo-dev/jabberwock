import { Constructor, nodeLength } from '../../../utils/src/utils';
import { Children } from './Children';

export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}

export enum VNodeType {
    NODE = 'node',
    MARKER = 'markerNode',
    FRAGMENT = 'fragmentNode',
}

export type Typeguard<T extends VNode> = (node: VNode) => node is T;
export type Predicate<T = boolean> = T extends VNode
    ? Constructor<T> | Typeguard<T>
    : (node: VNode) => boolean;

export type Point = [VNode, RelativePosition];

let id = 0;
interface VNodeConstructor {
    new <T extends Constructor<VNode>>(...args: ConstructorParameters<T>): this;
    atomic: boolean;
}
export interface VNode {
    constructor: VNodeConstructor & this;
}
export class VNode {
    static test(node: VNode): boolean {
        return node && node.test(this);
    }
    static readonly atomic: boolean = false;
    readonly type: VNodeType;
    readonly id = id;
    parent: VNode;
    attributes: Record<string, string | Record<string, string>> = {};
    children: Array<VNode> & {
        (predicate?: Predicate): VNode[];
        <T extends VNode>(predicate?: Constructor<T>): T[];
        <T>(predicate?: Predicate<T>): VNode[];
    } = new Children([]);
    constructor() {
        this.type = VNodeType.NODE;
        id++;
    }
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
    get name(): string {
        return this.constructor.name;
    }
    /**
     * @override
     */
    toString(): string {
        return this.name;
    }
    /**
     * A node is atomic when it is not allowed to have children in the
     * abstraction. Its real-life children should be ignored in the abstraction.
     * This getter allows us to call `this.atomic` on the extensions of `VNode`
     * while declaring the `atomic` property in a static way.
     */
    get atomic(): boolean {
        return this.constructor.atomic;
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
    locate(domNode: Node, offset: number): [VNode, RelativePosition] {
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
     * Return this VNode's inner text (concatenation of all descendent
     * char nodes values).
     *
     * @param __current
     */
    text(__current = ''): string {
        this.children().forEach((child: VNode): void => {
            __current = child.text(__current);
        });
        return __current;
    }
    /**
     * Return true if this VNode has children.
     */
    hasChildren(): boolean {
        return this.children().length > 0;
    }
    /**
     * Return true if this VNode comes before the given VNode in the pre-order
     * traversal.
     *
     * @param vNode
     */
    isBefore(vNode: VNode): boolean {
        const thisPath = [this, ...this.ancestors()];
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
                const thisIndex = thisParent.children.indexOf(thisAncestor);
                const nodeIndex = nodeParent.children.indexOf(nodeAncestor);
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
        return vNode.isBefore(this);
    }
    /**
     * Return whether this node is an instance of the given VNode class.
     *
     * @param predicate The subclass of VNode to test this node against.
     */
    is<T extends VNode>(predicate: Constructor<T> | Typeguard<T>): this is T {
        if (VNode.isConstructor(predicate)) {
            return this instanceof predicate;
        } else {
            return predicate(this);
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
        } else if (VNode.isConstructor(predicate)) {
            return this.is(predicate);
        } else {
            return predicate(this);
        }
    }

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

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
    nthChild(n: number): VNode {
        return this.children()[n - 1];
    }
    /**
     * Return this VNode's siblings.
     */
    get siblings(): VNode[] {
        return (this.parent && this.parent.children()) || [];
    }
    /**
     * Return the first ancestor of this VNode that satisfies the given
     * predicate.
     *
     * @param [predicate]
     */
    ancestor(predicate?: Predicate): VNode;
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
     * Return the first child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first child of this VNode.
     *
     * @param [predicate]
     */
    firstChild(predicate?: Predicate): VNode;
    firstChild<T extends VNode>(predicate?: Predicate<T>): T;
    firstChild<T>(predicate?: Predicate<T>): VNode;
    firstChild<T>(predicate?: Predicate<T>): VNode {
        let firstChild = this.children[0];
        while (firstChild && (isMarker(firstChild) || !firstChild.test(predicate))) {
            firstChild = firstChild.nextSibling();
        }
        return firstChild;
    }
    /**
     * Return the last child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last child of this VNode.
     *
     * @param [predicate]
     */
    lastChild(predicate?: Predicate): VNode;
    lastChild<T extends VNode>(predicate?: Predicate<T>): T;
    lastChild<T>(predicate?: Predicate<T>): VNode;
    lastChild<T>(predicate?: Predicate<T>): VNode {
        let lastChild = this.children[this.children.length - 1];
        while (lastChild && (isMarker(lastChild) || !lastChild.test(predicate))) {
            lastChild = lastChild.previousSibling();
        }
        return lastChild;
    }
    /**
     * Return the first leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first leaf of this VNode.
     *
     * @param [predicate]
     */
    firstLeaf(predicate?: Predicate): VNode;
    firstLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    firstLeaf<T>(predicate?: Predicate<T>): VNode;
    firstLeaf<T>(predicate?: Predicate<T>): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        };
        if (isValidLeaf(this)) {
            return this;
        } else {
            return this.firstDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * Return the last leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last leaf of this VNode.
     *
     * @param [predicate]
     */
    lastLeaf(predicate?: Predicate): VNode;
    lastLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    lastLeaf<T>(predicate?: Predicate<T>): VNode;
    lastLeaf<T>(predicate?: Predicate<T>): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        };
        if (isValidLeaf(this)) {
            return this;
        } else {
            return this.lastDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * Return the first descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the first descendant of this VNode.
     *
     * @param [predicate]
     */
    firstDescendant(predicate?: Predicate): VNode;
    firstDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    firstDescendant<T>(predicate?: Predicate<T>): VNode;
    firstDescendant<T>(predicate?: Predicate<T>): VNode {
        let firstDescendant = this.firstChild();
        while (firstDescendant && !firstDescendant.test(predicate)) {
            firstDescendant = this._descendantAfter(firstDescendant);
        }
        return firstDescendant;
    }
    /**
     * Return the last descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the last descendant of this VNode.
     *
     * @param [predicate]
     */
    lastDescendant(predicate?: Predicate): VNode;
    lastDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    lastDescendant<T>(predicate?: Predicate<T>): VNode;
    lastDescendant<T>(predicate?: Predicate<T>): VNode {
        let lastDescendant = this.lastChild();
        while (lastDescendant && lastDescendant.hasChildren()) {
            lastDescendant = lastDescendant.lastChild();
        }
        while (lastDescendant && !lastDescendant.test(predicate)) {
            lastDescendant = this._descendantBefore(lastDescendant);
        }
        return lastDescendant;
    }
    /**
     * Return the previous sibling of this VNode that satisfies the predicate.
     * If no predicate is given, return the previous sibling of this VNode.
     *
     * @param [predicate]
     */
    previousSibling(predicate?: Predicate): VNode;
    previousSibling<T extends VNode>(predicate?: Predicate<T>): T;
    previousSibling<T>(predicate?: Predicate<T>): VNode;
    previousSibling<T>(predicate?: Predicate<T>): VNode {
        if (!this.parent) return;
        const index = this.parent.children.indexOf(this);
        let sibling = this.parent.children[index - 1];
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && (isMarker(sibling) || !sibling.test(predicate))) {
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
    nextSibling(predicate?: Predicate): VNode;
    nextSibling<T extends VNode>(predicate?: Predicate<T>): T;
    nextSibling<T>(predicate?: Predicate<T>): VNode;
    nextSibling<T>(predicate?: Predicate<T>): VNode {
        if (!this.parent) return;
        const index = this.parent.children.indexOf(this);
        let sibling = this.parent.children[index + 1];
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && (isMarker(sibling) || !sibling.test(predicate))) {
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
    previous(predicate?: Predicate): VNode;
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
    next(predicate?: Predicate): VNode;
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
    previousLeaf(predicate?: Predicate): VNode;
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
    nextLeaf(predicate?: Predicate): VNode;
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
    previousSiblings(predicate?: Predicate): VNode[];
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
    nextSiblings(predicate?: Predicate): VNode[];
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
    /**
     * Return the closest node from this node that matches the given predicate.
     * Start with this node then go up the ancestors tree until finding a match.
     *
     * @param predicate
     */
    closest(predicate: Predicate): VNode;
    closest<T extends VNode>(predicate: Predicate<T>): T;
    closest<T>(predicate: Predicate<T>): VNode;
    closest<T>(predicate: Predicate<T>): VNode {
        return this.test(predicate) ? this : this.ancestor(predicate);
    }
    /**
     * Return all ancestors of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    ancestors(predicate?: Predicate): VNode[];
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
     * Return all descendants of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    descendants(predicate?: Predicate): VNode[];
    descendants<T extends VNode>(predicate?: Predicate<T>): T[];
    descendants<T>(predicate?: Predicate<T>): VNode[];
    descendants<T>(predicate?: Predicate<T>): VNode[] {
        const descendants = [];
        let currentDescendant = this.firstChild();
        while (currentDescendant) {
            if (currentDescendant.test(predicate)) {
                descendants.push(currentDescendant);
            }
            currentDescendant = this._descendantAfter(currentDescendant);
        }
        return descendants;
    }
    /**
     * Return the lowest common ancestor between this VNode and the given one.
     *
     * @param node
     */
    commonAncestor(node: VNode, predicate?: Predicate): VNode;
    commonAncestor<T extends VNode>(node: VNode, predicate?: Predicate<T>): T;
    commonAncestor<T>(node: VNode, predicate?: Predicate<T>): VNode;
    commonAncestor<T>(node: VNode, predicate?: Predicate<T>): VNode {
        if (!this.parent) {
            return;
        } else if (this.parent === node.parent && this.parent.test(predicate)) {
            return this.parent;
        }
        const thisPath = [this, ...this.ancestors(predicate)];
        const nodePath = [node, ...node.ancestors(predicate)];
        let commonAncestor: VNode;
        while (thisPath[thisPath.length - 1] === nodePath.pop()) {
            commonAncestor = thisPath.pop();
        }
        return commonAncestor;
    }

    //--------------------------------------------------------------------------
    // Updating
    //--------------------------------------------------------------------------

    /**
     * Insert the given VNode before this VNode. Return self.
     *
     * @param node
     */
    before(node: VNode): VNode {
        if (!this.parent) {
            throw 'Cannot insert a VNode before a VNode with no parent.';
        }
        return this.parent.insertBefore(node, this);
    }
    /**
     * Insert the given VNode after this VNode. Return self.
     *
     * @param node
     */
    after(node: VNode): VNode {
        if (!this.parent) {
            throw 'Cannot insert a VNode after a VNode with no parent.';
        }
        return this.parent.insertAfter(node, this);
    }
    /**
     * Prepend a child to this node. Return self.
     */
    prepend(...children: VNode[]): VNode {
        for (const child of children) {
            this._insertAtIndex(child, 0);
        }
        return this;
    }
    /**
     * Append a child to this VNode. Return self.
     */
    append(...children: VNode[]): VNode {
        for (const child of children) {
            this._insertAtIndex(child, this.children.length);
        }
        return this;
    }
    /**
     * Insert the given node before the given reference (which is a child of
     * this VNode). Return self.
     *
     * @param node
     * @param reference
     */
    insertBefore(node: VNode, reference: VNode): VNode {
        const index = this.children.indexOf(reference);
        if (index < 0) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        return this._insertAtIndex(node, index);
    }
    /**
     * Insert the given node after the given reference (which is a child of this
     * VNode). Return self.
     *
     * @param node
     * @param reference
     */
    insertAfter(node: VNode, reference: VNode): VNode {
        const index = this.children.indexOf(reference);
        if (index < 0) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        return this._insertAtIndex(node, index + 1);
    }
    /**
     * Remove all children of this VNode.
     */
    empty(): void {
        for (const child of this.children) {
            child.remove();
        }
    }
    /**
     * Remove this node.
     */
    remove(): void {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
    /**
     * Remove the given child from this VNode. Return self.
     *
     * @param child
     */
    removeChild(child: VNode): VNode {
        const index = this.children.indexOf(child);
        if (index < 0) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        return this._removeAtIndex(index);
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
    /**
     * Split this node at the given child, moving it and its next siblings into
     * a duplicate of this VNode that is inserted after the original. Return the
     * duplicated VNode.
     *
     * @param child
     */
    splitAt(child: VNode): VNode {
        if (child.parent !== this) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        const duplicate = this.clone();
        const index = child.parent.children.indexOf(child);
        while (this.children.length > index) {
            duplicate.append(this.children[index]);
        }
        this.after(duplicate);
        return duplicate;
    }

    /**
     * Merge this node with the given VNode.
     *
     * @param newContainer the new container for this node's children
     */
    mergeWith(newContainer: VNode): void {
        if (newContainer === this) return;
        if (this.children.length) {
            let reference = newContainer.children[newContainer.children.length - 1];
            this.children.slice().forEach(child => {
                if (reference) {
                    reference.after(child);
                } else {
                    newContainer.append(child);
                }
                reference = child;
            });
        }
        this.remove();
    }

    /**
     * Wrap this node in the given node by inserting the given node at this
     * node's position in its parent and appending this node to the given node.
     *
     * @param node
     */
    wrap(node: VNode): void {
        this.before(node);
        node.append(this);
    }

    /**
     * Unwrap this node by moving its children before it then removing it.
     */
    unwrap(): void {
        for (const child of this.children.slice()) {
            this.before(child);
        }
        this.remove();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the descendant of this node that directly precedes the given node
     * in depth-first pre-order traversal.
     *
     * @param node
     */
    _descendantBefore(node: VNode): VNode {
        let previous = node.previousSibling();
        if (previous) {
            // The node before node is the last leaf of its previous sibling.
            previous = previous.lastLeaf();
        } else if (node.parent !== this) {
            // If it has no previous sibling then climb up to the parent.
            // This is similar to `previous` but can't go further than `this`.
            previous = node.parent;
        }
        return previous;
    }
    /**
     * Return the descendant of this node that directly follows the given node
     * in depth-first pre-order traversal.
     *
     * @param node
     */
    _descendantAfter(node: VNode): VNode {
        // The node after node is its first child.
        let next = node.firstChild();
        if (!next) {
            // If it has no children then it is its next sibling.
            next = node.nextSibling();
        }
        if (!next) {
            // If it has no siblings either then climb up to the closest parent
            // which has a next sibiling.
            // This is similar to `next` but can't go further than `this`.
            let ancestor = node.parent;
            while (ancestor !== this && !ancestor.nextSibling()) {
                ancestor = ancestor.parent;
            }
            if (ancestor !== this) {
                next = ancestor.nextSibling();
            }
        }
        return next;
    }
    /**
     * Insert a VNode at the given index within this VNode's children.
     * Return self.
     *
     * @param child
     * @param index The index at which the insertion must take place within this
     * VNode's parent, holding marker nodes into account.
     */
    _insertAtIndex(child: VNode, index: number): VNode {
        if (child.parent) {
            const currentIndex = child.parent.children.indexOf(child);
            if (index && child.parent === this && currentIndex < index) {
                index--;
            }
            child.parent.removeChild(child);
        }
        this.children.splice(index, 0, child);
        child.parent = this;
        return this;
    }
    /**
     * Remove the nth child from this node. Return self.
     *
     * @param index The index of the child to remove including marker nodes.
     */
    _removeAtIndex(index: number): VNode {
        const child = this.children.splice(index, 1)[0];
        child.parent = undefined;
        return this;
    }
    /**
     * Return a convenient string representation of this node and its
     * descendants.
     *
     * @param __repr
     * @param level
     */
    _repr(__repr = '', level = 0): string {
        __repr += Array(level * 4 + 1).join(' ') + this.name + ' (' + this.id + ')' + '\n';
        this.children.forEach(child => {
            __repr = child._repr(__repr, level + 1);
        });
        return __repr;
    }
}

/**
 * Return true if the given node is ignored from traversal.
 *
 * @param node node to check
 */
export function isMarker(node: VNode): boolean {
    return node.type === VNodeType.MARKER;
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
