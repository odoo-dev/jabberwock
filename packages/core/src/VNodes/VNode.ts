import { BasicHtmlRenderingEngine, RenderingEngine } from '../BasicHtmlRenderingEngine';
import { Predicate } from '../../../utils/src/Predicates';
import { RelativePosition } from '../../../utils/src/selection';
import { utils } from '../../../utils/src/utils';
import { withMarkers, isWithMarkers } from '../../../utils/src/markers';

export enum VNodeType {
    NODE = 'node',
    MARKER = 'marker',
    FRAGMENT = 'fragment',
}
export function isMarker(node: VNode): boolean {
    return node.type === VNodeType.MARKER;
}
let id = 0;

export class VNode {
    static readonly atomic: boolean = false;
    readonly type: VNodeType;
    readonly id = id;
    parent: VNode;
    renderingEngines: Record<string, RenderingEngine> = {
        html: BasicHtmlRenderingEngine,
    };
    name: string;
    _children: VNode[] = [];

    constructor() {
        this.type = VNodeType.NODE;
        this.name = this.constructor.name;
        id++;
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
        return (this.constructor as typeof VNode).atomic;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse: (node: Node) => VNode[];
    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    render<T>(to = 'html'): T {
        return this.renderingEngines[to].render(this) as T;
    }
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
        const domNodeLength = utils.nodeLength(domNode);
        if (domNodeLength && offset >= domNodeLength) {
            position = RelativePosition.AFTER;
        }
        return [this, position];
    }
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VNode {
        return new VNode();
    }

    //--------------------------------------------------------------------------
    // Properties
    //--------------------------------------------------------------------------

    /**
     * Return the VNode's children.
     */
    get children(): VNode[] {
        if (isWithMarkers) {
            return this._children;
        }
        return this._children.filter(child => !isMarker(child));
    }
    /**
     * Return the length of this VNode.
     */
    get length(): number {
        return this.children.length;
    }
    /**
     * Return the index of this VNode within its parent.
     *
     * @see indexOf
     */
    get index(): number {
        return (this.parent && this.parent.indexOf(this)) || 0;
    }
    /**
     * Return the index of the child within this VNode.
     * Return -1 if the child was not found.
     *
     * @param child
     */
    indexOf(child: VNode): number {
        return this.children.indexOf(child);
    }
    /**
     * Return this VNode's inner text (concatenation of all descendent
     * char nodes values).
     *
     * @param __current
     */
    text(__current = ''): string {
        this.children.forEach((child: VNode): void => {
            __current = child.text(__current);
        });
        return __current;
    }
    /**
     * Return true if this VNode has children.
     */
    hasChildren(): boolean {
        return this.children.length > 0;
    }
    /**
     * Return true if this VNode comes before the given VNode in the pre-order
     * traversal.
     *
     * @param vNode
     */
    isBefore(vNode: VNode): boolean {
        const path = [].concat(this, ...this.ancestors());
        const otherPath = [].concat(vNode, ...vNode.ancestors());
        let ancestor = path.pop();
        let otherAncestor = otherPath.pop();
        // Compare the ancestors of each nodes one by one, in a path to the
        // root. While the ancestors are the same in both, continue on the path.
        while (ancestor && otherAncestor && ancestor === otherAncestor) {
            ancestor = path.pop();
            otherAncestor = otherPath.pop();
        }
        // If we reached the end of one of the paths, that is when one of the
        // ancestors is undefined, then the VNode that originally generated this
        // path is itself part of the ancestors path of the other VNode. This
        // VNode is definitely first in traversal since the other is a
        // descendent of it. Otherwise, compare the ancestors indices. The
        // smaller of the two indicees gives us the first VNode in traversal.
        if (ancestor && otherAncestor) {
            const index = withMarkers(() => ancestor.index);
            const otherIndex = withMarkers(() => otherAncestor.index);
            return index < otherIndex;
        } else {
            return !ancestor && !!otherAncestor;
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

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

    /**
     * Return the child at given index.
     *
     * @see _nthChild
     * @param index
     */
    nthChild(index: number): VNode {
        return this.children[index];
    }
    /**
     * Return this VNode's siblings.
     */
    get siblings(): VNode[] {
        return (this.parent && this.parent.children) || [];
    }
    /**
     * Return the first child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first child of this VNode.
     *
     * @param [predicate]
     */
    firstChild(predicate?: Predicate): VNode {
        const firstChild = this.nthChild(0);
        if (firstChild && predicate) {
            return firstChild.walk((node: VNode) => node.nextSibling(), predicate);
        } else {
            return firstChild;
        }
    }
    /**
     * Return the last child of this VNode that satisfies the given predicate.
     * If no predicate is given, return the last child of this VNode.
     *
     * @param [predicate]
     */
    lastChild(predicate?: Predicate): VNode {
        const lastChild = this.nthChild(this.children.length - 1);
        if (lastChild && predicate) {
            return lastChild.walk((node: VNode) => node.previousSibling(), predicate);
        } else {
            return lastChild;
        }
    }
    /**
     * Return the first leaf of this VNode that satisfies the given predicate.
     * If no predicate is given, return the first leaf of this VNode.
     *
     * @param [predicate]
     */
    firstLeaf(predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && (!predicate || predicate(node));
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
    lastLeaf(predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && (!predicate || predicate(node));
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
    firstDescendant(predicate?: Predicate): VNode {
        const firstDescendant = this.firstChild();
        if (firstDescendant && predicate) {
            return firstDescendant.walk((node: VNode) => this._descendantAfter(node), predicate);
        } else {
            return firstDescendant;
        }
    }
    /**
     * Return the last descendant of this VNode that satisfies the predicate.
     * If no predicate is given, return the last descendant of this VNode.
     *
     * @param [predicate]
     */
    lastDescendant(predicate?: Predicate): VNode {
        let lastDescendant = this.lastChild();
        while (lastDescendant && lastDescendant.hasChildren()) {
            lastDescendant = lastDescendant.lastChild();
        }
        if (lastDescendant && predicate) {
            return lastDescendant.walk((node: VNode) => this._descendantBefore(node), predicate);
        } else {
            return lastDescendant;
        }
    }
    /**
     * Return the previous sibling of this VNode that satisfies the predicate.
     * If no predicate is given, return the previous sibling of this VNode.
     *
     * @param [predicate]
     */
    previousSibling(predicate?: Predicate): VNode {
        const previousSibling = this.parent && this.parent._adjacentChild(this, 'previous');
        if (previousSibling && predicate) {
            return previousSibling.walk((node: VNode) => node.previousSibling(), predicate);
        } else {
            return previousSibling;
        }
    }
    /**
     * Return the next sibling of this VNode that satisfies the given predicate.
     * If no predicate is given, return the next sibling of this VNode.
     *
     * @param [predicate]
     */
    nextSibling(predicate?: Predicate): VNode {
        const nextSibling = this.parent && this.parent._adjacentChild(this, 'next');
        if (nextSibling && predicate) {
            return nextSibling.walk((node: VNode) => node.nextSibling(), predicate);
        } else {
            return nextSibling;
        }
    }
    /**
     * Return the previous node in a depth-first pre-order traversal of the
     * tree that satisfies the given predicate. If no predicate is given return
     * the previous node in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    previous(predicate?: Predicate): VNode {
        let previous = this.previousSibling();
        if (previous) {
            // The previous node is the last leaf of the previous sibling.
            previous = previous.lastLeaf();
        } else {
            // If it has no previous sibling then climb up to the parent.
            previous = this.parent;
        }
        if (previous && predicate) {
            return previous.walk((node: VNode) => node.previous(), predicate);
        } else {
            return previous;
        }
    }
    /**
     * Return the next node in a depth-first pre-order traversal of the tree
     * that satisfies the given predicate. If no predicate is given return the
     * next node in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    next(predicate?: Predicate): VNode {
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
        if (next && predicate) {
            return next.walk((node: VNode) => node.next(), predicate);
        } else {
            return next;
        }
    }
    /**
     * Return the previous leaf in a depth-first pre-order traversal of the
     * tree that satisfies the given predicate. If no predicate is given return
     * the previous leaf in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    previousLeaf(predicate?: Predicate): VNode {
        return this.previous((node: VNode): boolean => {
            return isLeaf(node) && (!predicate || predicate(node));
        });
    }
    /**
     * Return the next leaf in a depth-first pre-order traversal of the tree
     * that satisfies the given predicate. If no predicate is given return the
     * next leaf in a depth-first pre-order traversal of the tree.
     *
     * @param [predicate]
     */
    nextLeaf(predicate?: Predicate): VNode {
        return this.next((node: VNode): boolean => {
            return isLeaf(node) && (!predicate || predicate(node));
        });
    }
    /**
     * Return all previous siblings of the current node that satisfy the given
     * predicate. If no predicate is given return all the previous siblings of
     * the current node.
     *
     * @param [predicate]
     */
    previousSiblings(predicate?: Predicate): VNode[] {
        const previousSiblings: VNode[] = [];
        let sibling = this.previousSibling();
        while (sibling) {
            if (!predicate || predicate(sibling)) {
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
    nextSiblings(predicate?: Predicate): VNode[] {
        const nextSiblings: VNode[] = [];
        let sibling = this.nextSibling();
        while (sibling) {
            if (!predicate || predicate(sibling)) {
                nextSiblings.push(sibling);
            }
            sibling = sibling.nextSibling();
        }
        return nextSiblings;
    }
    /**
     * Return all ancestors of the current node that satisfy the given
     * predicate. If no predicate is given return all the ancestors of the
     * current node.
     *
     * @param [predicate]
     */
    ancestors(predicate?: Predicate): VNode[] {
        const ancestors: VNode[] = [];
        let parent = this.parent;
        while (parent) {
            if (!predicate || predicate(parent)) {
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
    descendants(predicate?: Predicate): VNode[] {
        const descendants = [];
        if (this.children) {
            let currentDescendant = this.firstChild();
            do {
                if (!predicate || predicate(currentDescendant)) {
                    descendants.push(currentDescendant);
                }
                currentDescendant = this._descendantAfter(currentDescendant);
            } while (currentDescendant);
        }
        return descendants;
    }
    /**
     * Walk the document tree starting from the current node (included) by
     * calling the `next` iterator until the returned node satisfies the given
     * predicate or is falsy.
     *
     * @param next
     * @param [predicate]
     */
    walk(next: (node: VNode) => VNode, predicate: Predicate): VNode {
        let node: VNode;
        node = this;
        while (node && !predicate(node)) {
            node = next(node);
        }
        return node;
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
        return this.parent.insertBefore(node, this);
    }
    /**
     * Insert the given VNode after this VNode. Return self.
     *
     * @param node
     */
    after(node: VNode): VNode {
        return this.parent.insertAfter(node, this);
    }
    /**
     * Prepend a child to this node. Return self.
     */
    prepend(child: VNode): VNode {
        return this._insertAtIndex(child, 0);
    }
    /**
     * Append a child to this VNode. Return self.
     */
    append(child: VNode): VNode {
        return this._insertAtIndex(child, this._children.length);
    }
    /**
     * Insert the given node before the given reference (which is a child of
     * this VNode). Return self.
     *
     * @param node
     * @param reference
     */
    insertBefore(node: VNode, reference: VNode): VNode {
        return withMarkers(() => {
            const index = this.indexOf(reference);
            if (index < 0) {
                throw new Error('The given VNode is not a child of this VNode');
            }
            return this._insertAtIndex(node, index);
        });
    }
    /**
     * Insert the given node after the given reference (which is a child of this
     * VNode). Return self.
     *
     * @param node
     * @param reference
     */
    insertAfter(node: VNode, reference: VNode): VNode {
        return withMarkers(() => {
            const index = this.indexOf(reference);
            if (index < 0) {
                throw new Error('The given VNode is not a child of this VNode');
            }
            return this._insertAtIndex(node, index + 1);
        });
    }
    /**
     * Remove this node.
     */
    remove(): void {
        this.parent.removeChild(this);
    }
    /**
     * Remove the given child from this VNode. Return self.
     *
     * @param child
     */
    removeChild(child: VNode): VNode {
        return withMarkers(() => {
            const index = this.indexOf(child);
            if (index < 0) {
                throw new Error('The given VNode is not a child of this VNode');
            }
            return this._removeAtIndex(index);
        });
    }
    /**
     * Split this node at the given child, moving it and its next siblings into
     * a duplicate of this VNode that is inserted after the original. Return the
     * duplicated VNode.
     *
     * @param child
     */
    splitAt(child: VNode): VNode {
        const nodesToMove = [child];
        nodesToMove.push(...withMarkers(() => child.nextSiblings()));
        const duplicate = this.shallowDuplicate();
        this.after(duplicate);
        nodesToMove.forEach(sibling => duplicate.append(sibling));
        return duplicate;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the child's next (`direction === 'forward'`) or previous
     * (`direction === 'backward'`) sibling.
     *
     * @param child
     * @param direction ('backward' for the previous child,
     *                   'forward' for the next child)
     */
    _adjacentChild(child: VNode, direction: 'previous' | 'next'): VNode {
        const adjacentChild = withMarkers(() => {
            const index = this.indexOf(child);
            return this.nthChild(direction === 'next' ? index + 1 : index - 1);
        });
        // Ignore marker nodes by default.
        if (!isWithMarkers && adjacentChild && isMarker(adjacentChild)) {
            return this._adjacentChild(adjacentChild, direction);
        } else {
            return adjacentChild;
        }
    }
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
            const currentIndex = withMarkers(() => child.parent.indexOf(child));
            if (index && child.parent === this && currentIndex < index) {
                index--;
            }
            child.parent.removeChild(child);
        }
        this._children.splice(index, 0, child);
        child.parent = this;
        return this;
    }
    /**
     * Remove the nth child from this node. Return self.
     *
     * @param index The index of the child to remove, marker nodes included.
     */
    _removeAtIndex(index: number): VNode {
        this._children.splice(index, 1);
        return this;
    }
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
