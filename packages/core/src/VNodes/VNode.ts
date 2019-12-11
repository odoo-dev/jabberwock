import { BasicHtmlRenderingEngine, RenderingEngine } from '../BasicHtmlRenderingEngine';
import { Predicate, isRange, isLeaf, not } from '../../../utils/src/Predicates';
import { RelativePosition } from '../../../utils/src/range';
import { utils, isWithRange } from '../../../utils/src/utils';

export enum VNodeType {
    ROOT = 'root',
    RANGE_TAIL = 'range_tail',
    RANGE_HEAD = 'range_head',
    PARAGRAPH = 'paragraph',
    HEADING1 = 'heading1',
    HEADING2 = 'heading2',
    HEADING3 = 'heading3',
    HEADING4 = 'heading4',
    HEADING5 = 'heading5',
    HEADING6 = 'heading6',
    CHAR = 'char',
    LINE_BREAK = 'line_break',
}
let id = 0;

export class VNode {
    readonly type: VNodeType | string;
    readonly id = id;
    parent: VNode | null = null;
    renderingEngines: Record<string, RenderingEngine> = {
        html: BasicHtmlRenderingEngine,
    };
    name: string;
    htmlTag: string;
    _children: VNode[] = [];

    constructor(type: VNodeType | string) {
        this.type = type;
        this.name = this.type;
        id++;
    }
    /**
     * @override
     */
    toString(): string {
        let string = this.constructor.name + '<' + this.type.toLowerCase();
        if (this.hasChildren()) {
            string += '>';
            this.children.forEach(child => {
                string += child.toString();
            });
            string += '<' + this.type.toLowerCase() + '>';
        } else {
            string += '/>';
        }
        return string;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static parse(node: Node): VNode | VNode[] | null {
        return null;
    }
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
     * Locate where to set the range, when it targets this VNode, at a certain
     * offset. This allows us to handle special cases.
     *
     * @param domNode
     * @param offset
     */
    locateRange(domNode: Node, offset: number): [VNode, RelativePosition] {
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
        return new VNode(this.type);
    }

    //--------------------------------------------------------------------------
    // Properties
    //--------------------------------------------------------------------------

    /**
     * Return true if the VNode is atomic (ie. it may not have children).
     */
    get atomic(): boolean {
        return false;
    }
    /**
     * Return the VNode's children.
     */
    get children(): VNode[] {
        if (isWithRange) {
            return this._children;
        }
        return this._children.filter(not(isRange));
    }
    /**
     * Return the length of this VNode.
     */
    get length(): number {
        return this.children.length;
    }
    /**
     * Return the length of this node and all its descendents.
     *
     * @param __current
     */
    totalLength(__current = 0): number {
        __current += this.length;
        this.children.forEach((child: VNode): void => {
            if (child.hasChildren()) {
                __current = child.totalLength(__current);
            }
        });
        return __current;
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
     * TODO: Make a less naive version of this, performing an efficient search
     * instead of a full traversal.
     *
     * @param vNode
     */
    isBefore(vNode: VNode): boolean {
        return !!this.next((node: VNode) => node.id === vNode.id);
    }
    /**
     * Return true if this VNode comes after the given VNode in the pre-order
     * traversal.
     *
     * TODO: Make a less naive version of this, performing an efficient search
     * instead of a full traversal.
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
        const previousSibling = this.parent && this.parent._childBefore(this);
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
        const nextSibling = this.parent && this.parent._childAfter(this);
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
        while (sibling && (!predicate || predicate(sibling))) {
            previousSiblings.push(sibling);
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
        while (sibling && (!predicate || predicate(sibling))) {
            nextSiblings.push(sibling);
            sibling = sibling.nextSibling();
        }
        return nextSiblings;
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
        return utils.withRange(() => {
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
        return utils.withRange(() => {
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
        return utils.withRange(() => {
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
        nodesToMove.push(...utils.withRange(() => child.nextSiblings()));
        const duplicate = this.shallowDuplicate();
        this.after(duplicate);
        nodesToMove.forEach(sibling => duplicate.append(sibling));
        return duplicate;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the child's previous sibling.
     *
     * @param child
     */
    _childBefore(child: VNode): VNode {
        const childBefore = utils.withRange(() => this.nthChild(this.indexOf(child) - 1));
        // Ignore range nodes by default.
        if (!isWithRange && childBefore && isRange(childBefore)) {
            return this._childBefore(childBefore);
        } else {
            return childBefore;
        }
    }
    /**
     * Return the child's next sibling.
     *
     * @param child
     */
    _childAfter(child: VNode): VNode {
        const childAfter = utils.withRange(() => this.nthChild(this.indexOf(child) + 1));
        // Ignore range nodes by default.
        if (!isWithRange && childAfter && isRange(childAfter)) {
            return this._childAfter(childAfter);
        } else {
            return childAfter;
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
     * VNode's parent, holding range nodes into account.
     */
    _insertAtIndex(child: VNode, index: number): VNode {
        if (child.parent) {
            const currentIndex = utils.withRange(() => child.parent.indexOf(child));
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
     * @param index The index of the child to remove, accounting for range nodes.
     */
    _removeAtIndex(index: number): VNode {
        this._children.splice(index, 1);
        return this;
    }
}
