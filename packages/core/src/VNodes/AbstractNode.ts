import { VNode, RelativePosition, Predicate, isLeaf } from './VNode';
import {
    Constructor,
    nodeLength,
    isContentEditable,
    hasContentEditable,
} from '../../../utils/src/utils';
import { ContainerNode } from './ContainerNode';
import { AtomicNode } from './AtomicNode';
import { Modifiers } from '../Modifiers';
import { EventMixin } from '../../../utils/src/EventMixin';
import { Modifier } from '../Modifier';
import { markAsDiffRoot } from '../Memory/Memory';
import { makeVersionable } from '../Memory/Versionable';

export interface AbstractNodeParams {
    modifiers?: Modifiers | Array<Modifier | Constructor<Modifier>>;
}

let id = 0;
export abstract class AbstractNode extends EventMixin {
    readonly id = id;
    private _editable: boolean;
    /**
     * True if the node is editable. Propagates to the children.
     * A node that is editable can have its modifiers edited, be moved, removed,
     * and a selection can be made within it.
     * Can be overridden with a `Mode`.
     */
    get editable(): boolean {
        if (this._editable === false) return false;
        const modifiers = this.modifiers.filter(mod => 'modifiers' in mod);
        const lastModifierWithContentEditable = modifiers.reverse().find(modifier => {
            return hasContentEditable(modifier);
        });
        if (lastModifierWithContentEditable) {
            return isContentEditable(lastModifierWithContentEditable);
        }
        return (
            !this.parent ||
            (hasContentEditable(this.parent)
                ? isContentEditable(this.parent)
                : this.parent.editable)
        );
    }
    set editable(state: boolean) {
        this._editable = state;
    }
    /**
     * True If the node will have a representation in the dom. Eg: markers are
     * not tangible.
     */
    tangible = true;
    /**
     * True if the node can be split.
     * Can be overridden with a `Mode`.
     */
    breakable = true;
    /**
     * First tangible parent of the VNode.
     */
    get parent(): ContainerNode {
        let parent = this.parentVNode;
        while (parent && !parent.tangible) {
            parent = parent.parentVNode;
        }
        return parent;
    }
    /**
     * Direct parent of the VNode.
     */
    parentVNode: ContainerNode;
    /**
     * All children VNodes.
     */
    childVNodes: VNode[];
    _modifiers: Modifiers;
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
        this.modifiers = new Modifiers();
        if (params?.modifiers) {
            if (params.modifiers instanceof Modifiers) {
                this.modifiers = params.modifiers;
            } else {
                this.modifiers.append(...params.modifiers);
            }
        }
        const node = makeVersionable(this);
        markAsDiffRoot(node);
        return node;
    }

    get modifiers(): Modifiers {
        return this._modifiers;
    }
    set modifiers(modifiers: Modifiers) {
        if (this._modifiers) {
            this._modifiers.off('update');
        }
        this._modifiers = modifiers;
        this._modifiers.on('update', () => this.trigger('modifierUpdate'));
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

    /**
     * Replace this VNode with the given VNode.
     *
     * @param node
     */
    replaceWith(node: VNode): void {
        this.before(node);
        this.mergeWith(node);
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
    test(predicate?: Predicate): boolean {
        if (!predicate) {
            return true;
        } else if (AbstractNode.isConstructor(predicate)) {
            return this instanceof predicate;
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
        const thisPath = [this as VNode];
        let parent = this.parentVNode;
        while (parent) {
            thisPath.push(parent);
            parent = parent.parentVNode;
        }
        const nodePath = [vNode];
        parent = vNode.parentVNode;
        while (parent) {
            nodePath.push(parent);
            parent = parent.parentVNode;
        }
        // Find the last distinct ancestors in the path to the root.
        let thisAncestor: VNode;
        let nodeAncestor: VNode;
        do {
            thisAncestor = thisPath.pop();
            nodeAncestor = nodePath.pop();
        } while (thisAncestor && nodeAncestor && thisAncestor === nodeAncestor);

        if (thisAncestor && nodeAncestor) {
            const thisParent = thisAncestor.parentVNode;
            const nodeParent = nodeAncestor.parentVNode;
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
    closest(predicate: Predicate): VNode;
    closest(predicate: Predicate): VNode {
        if (this.test(predicate)) {
            return this as VNode;
        } else {
            return this.ancestor(predicate);
        }
    }
    /**
     * Return the first tangible ancestor of this VNode that satisfies the
     * given predicate.
     *
     * @param [predicate]
     */
    ancestor<T extends VNode>(predicate?: Predicate<T>): T;
    ancestor(predicate?: Predicate): ContainerNode;
    ancestor(predicate?: Predicate): ContainerNode {
        let ancestor = this.parentVNode;
        while (ancestor && (!ancestor.tangible || (predicate && !ancestor.test(predicate)))) {
            ancestor = ancestor.parentVNode;
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
    ancestors(predicate?: Predicate): ContainerNode[];
    ancestors(predicate?: Predicate): ContainerNode[] {
        const ancestors: ContainerNode[] = [];
        let ancestor = this.parentVNode;
        while (ancestor) {
            if (ancestor.tangible && (!predicate || ancestor.test(predicate))) {
                ancestors.push(ancestor);
            }
            ancestor = ancestor.parentVNode;
        }
        return ancestors;
    }
    /**
     * Return the lowest common ancestor between this VNode and the given one.
     *
     * @param node
     */
    commonAncestor<T extends VNode>(node: VNode, predicate?: Predicate<T>): T;
    commonAncestor(node: VNode, predicate?: Predicate): ContainerNode;
    commonAncestor(node: VNode, predicate?: Predicate): ContainerNode {
        const thisPath = this.ancestors(predicate);
        if (this !== node && this instanceof ContainerNode) {
            thisPath.unshift(this);
        }
        let commonAncestor = node as ContainerNode;
        while (
            (commonAncestor && !thisPath.includes(commonAncestor)) ||
            (predicate && !commonAncestor.test(predicate))
        ) {
            commonAncestor = commonAncestor.parentVNode;
        }
        return commonAncestor;
    }
    /**
     * Return the siblings of this VNode which satisfy the given predicate.
     *
     * @param [predicate]
     */
    siblings<T extends VNode>(predicate?: Predicate<T>): T[];
    siblings(predicate?: Predicate): VNode[];
    siblings(predicate?: Predicate): VNode[] {
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
     * Note: include this VNode within the return value, in order of appearance
     * (if it satisfies the given predicate).
     */
    adjacents<T extends VNode>(predicate?: Predicate<T>): T[];
    adjacents(predicate?: Predicate): VNode[];
    adjacents(predicate?: Predicate): VNode[] {
        const adjacents: VNode[] = [];
        let sibling: VNode = this.previousSibling();
        while (sibling && sibling.test(predicate)) {
            adjacents.unshift(sibling);
            sibling = sibling.previousSibling();
        }
        if (this.test(predicate)) {
            adjacents.push(this as VNode);
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
    previousSibling(predicate?: Predicate): VNode;
    previousSibling(predicate?: Predicate): VNode {
        let node = this as VNode;
        let sibling: VNode;
        while (!sibling && node) {
            const parentVNode = node.parentVNode;
            if (!parentVNode) return;
            const childVNodes = parentVNode.childVNodes;
            const index = childVNodes.indexOf(node);
            sibling = childVNodes[index - 1];
            // Can climb up the not tangible container.
            node = !sibling && !parentVNode.tangible && parentVNode;
        }
        if (sibling instanceof ContainerNode && !sibling.tangible && sibling.hasChildren()) {
            // Ignore the not tangible container.
            sibling = sibling.lastChild();
        }
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && !(sibling.tangible && sibling.test(predicate))) {
            // Do not give the predicate to limit the stack of calls.
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
    nextSibling(predicate?: Predicate): VNode;
    nextSibling(predicate?: Predicate): VNode {
        let node = this as VNode;
        let sibling: VNode;
        while (!sibling && node) {
            const parentVNode = node.parentVNode;
            if (!parentVNode) return;
            const childVNodes = parentVNode.childVNodes;
            const index = childVNodes.indexOf(node);
            sibling = index !== -1 && childVNodes[index + 1];
            // Can climb up the not tangible container.
            node = !sibling && !parentVNode.tangible && parentVNode;
        }
        if (sibling instanceof ContainerNode && !sibling.tangible && sibling.hasChildren()) {
            // Ignore the not tangible container.
            sibling = sibling.firstChild();
        }
        // Skip ignored siblings and those failing the predicate test.
        while (sibling && !(sibling.tangible && sibling.test(predicate))) {
            // Do not give the predicate to limit the stack of calls.
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
    previous(predicate?: Predicate): VNode;
    previous(predicate?: Predicate): VNode {
        let previous = this.previousSibling();
        if (previous) {
            // The previous node is the last leaf of the previous sibling.
            previous = previous.lastLeaf();
        } else {
            // If it has no siblings either then climb up to the closest parent
            // which has a next sibiling.
            previous = this.parent;
        }
        while (previous && (!previous.tangible || (predicate && !previous.test(predicate)))) {
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
    next(predicate?: Predicate): VNode;
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
        while (next && (!next.tangible || (predicate && !next.test(predicate)))) {
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
    previousLeaf(predicate?: Predicate): VNode;
    previousLeaf(predicate?: Predicate): VNode {
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
    nextLeaf(predicate?: Predicate): VNode;
    nextLeaf(predicate?: Predicate): VNode {
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
    previousSiblings(predicate?: Predicate): VNode[];
    previousSiblings(predicate?: Predicate): VNode[] {
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
    nextSiblings(predicate?: Predicate): VNode[];
    nextSiblings(predicate?: Predicate): VNode[] {
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
        if (!this.parentVNode) {
            throw new Error('Cannot insert a VNode before a VNode with no parent.');
        }
        this.parentVNode.insertBefore(node, this as VNode);
    }
    /**
     * Insert the given VNode after this VNode.
     *
     * @param node
     */
    after(node: VNode): void {
        if (!this.parentVNode) {
            throw new Error('Cannot insert a VNode after a VNode with no parent.');
        }
        this.parentVNode.insertAfter(node, this as VNode);
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
        const parent = this.parent || this.parentVNode;
        if (parent) {
            parent.removeChild(this as VNode);
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
     * Return the tangible children of this VNode which satisfy the given
     * predicate.
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
     * Note: make sure to check that the node is breakable before attempting to
     * split it.
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
        if (this.parentVNode) {
            await this.parentVNode.trigger(eventName, args);
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
