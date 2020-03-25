import { VNode, Predicate, isLeaf, TNode, isTangible } from './VNode';
import { ChildNode } from './ChildNode';
import { ChildError } from '../../../utils/src/errors';

export class ContainerNode extends ChildNode {
    static test(node: VNode): boolean {
        return node && node.test(this);
    }

    readonly atomic: false = false;
    readonly childVNodes = [];

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

    /**
     * See {@link VNode.children}.
     */
    children<T extends TNode>(predicate?: Predicate<T>): T[];
    children(predicate?: Predicate): TNode[];
    children<T>(predicate?: Predicate<T>): TNode[] {
        return this.childVNodes.filter(child => {
            return child.tangible && child.test(predicate);
        });
    }
    /**
     * See {@link VNode.nthChild}.
     */
    nthChild(n: number): TNode {
        return this.children()[n - 1];
    }
    /**
     * See {@link VNode.length}.
     */
    get length(): number {
        return this.children().length;
    }
    /**
     * See {@link VNode.hasChildren}.
     */
    hasChildren(): boolean {
        return this.children().length > 0;
    }
    /**
     * See {@link VNode.firstChild}.
     */
    firstChild<T extends TNode>(predicate?: Predicate<T>): T;
    firstChild<T>(predicate?: Predicate<T>): TNode;
    firstChild<T>(predicate?: Predicate<T>): TNode {
        let child = this.childVNodes[0];
        while (child && !(child.tangible && child.test(predicate))) {
            child = child.nextSibling();
        }
        return child;
    }
    /**
     * See {@link VNode.lastChild}.
     */
    lastChild<T extends TNode>(predicate?: Predicate<T>): T;
    lastChild<T>(predicate?: Predicate<T>): TNode;
    lastChild<T>(predicate?: Predicate<T>): TNode {
        let child = this.childVNodes[this.childVNodes.length - 1];
        while (child && !(child.tangible && child.test(predicate))) {
            child = child.previousSibling();
        }
        return child;
    }
    /**
     * See {@link VNode.firstLeaf}.
     */
    firstLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    firstLeaf<T>(predicate?: Predicate<T>): TNode;
    firstLeaf<T>(predicate?: Predicate<T>): TNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        };
        if (isTangible(this) && isValidLeaf(this)) {
            return this;
        } else {
            return this.firstDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * See {@link VNode.lastLeaf}.
     */
    lastLeaf<T extends TNode>(predicate?: Predicate<T>): T;
    lastLeaf<T>(predicate?: Predicate<T>): TNode;
    lastLeaf<T>(predicate?: Predicate<T>): TNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && node.test(predicate);
        };
        if (isTangible(this) && isValidLeaf(this)) {
            return this;
        } else {
            return this.lastDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * See {@link VNode.firstDescendant}.
     */
    firstDescendant<T extends TNode>(predicate?: Predicate<T>): T;
    firstDescendant<T>(predicate?: Predicate<T>): TNode;
    firstDescendant<T>(predicate?: Predicate<T>): TNode {
        let firstDescendant = this.firstChild();
        while (firstDescendant && !firstDescendant.test(predicate)) {
            firstDescendant = this._descendantAfter(firstDescendant);
        }
        return firstDescendant;
    }
    /**
     * See {@link VNode.lastDescendant}.
     */
    lastDescendant<T extends TNode>(predicate?: Predicate<T>): T;
    lastDescendant<T>(predicate?: Predicate<T>): TNode;
    lastDescendant<T>(predicate?: Predicate<T>): TNode {
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
     * See {@link VNode.descendants}.
     */
    descendants<T extends TNode>(predicate?: Predicate<T>): T[];
    descendants<T>(predicate?: Predicate<T>): TNode[];
    descendants<T>(predicate?: Predicate<T>): TNode[] {
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

    //--------------------------------------------------------------------------
    // Updating
    //--------------------------------------------------------------------------

    /**
     * See {@link VNode.prepend}.
     */
    prepend(...children: VNode[]): void {
        for (const child of children) {
            this._insertAtIndex(child, 0);
        }
    }
    /**
     * See {@link VNode.append}.
     */
    append(...children: VNode[]): void {
        for (const child of children) {
            this._insertAtIndex(child, this.childVNodes.length);
        }
    }
    /**
     * See {@link VNode.insertBefore}.
     */
    insertBefore(node: VNode, reference: VNode): void {
        const index = this.childVNodes.indexOf(reference);
        if (index < 0) {
            throw new ChildError(this, node);
        }
        this._insertAtIndex(node, index);
    }
    /**
     * See {@link VNode.insertAfter}.
     */
    insertAfter(node: VNode, reference: VNode): void {
        const index = this.childVNodes.indexOf(reference);
        if (index < 0) {
            throw new ChildError(this, node);
        }
        this._insertAtIndex(node, index + 1);
    }
    /**
     * See {@link VNode.empty}.
     */
    empty(): void {
        for (const child of this.childVNodes) {
            child.remove();
        }
    }
    /**
     * See {@link VNode.removeChild}.
     */
    removeChild(child: VNode): void {
        const index = this.childVNodes.indexOf(child);
        if (index < 0) {
            throw new ChildError(this, child);
        }
        this._removeAtIndex(index);
    }
    /**
     * See {@link VNode.splitAt}.
     */
    splitAt(child: VNode): this {
        if (child.parent !== this) {
            throw new ChildError(this, child);
        } else if (!this.breakable) {
            // Unbreakable nodes do not split.
            return this;
        }
        const duplicate = this.clone();
        const index = child.parent.childVNodes.indexOf(child);
        while (this.childVNodes.length > index) {
            duplicate.append(this.childVNodes[index]);
        }
        this.after(duplicate);
        return duplicate;
    }
    /**
     * See {@link VNode.mergeWith}.
     */
    mergeWith(newContainer: VNode): void {
        if (newContainer !== this) {
            newContainer.append(...this.childVNodes);
            this.remove();
        }
    }
    /**
     * See {@link VNode.unwrap}.
     */
    unwrap(): void {
        for (const child of this.childVNodes.slice()) {
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
    _descendantBefore(node: VNode): TNode {
        let previous = node.previousSibling();
        if (previous) {
            // The node before node is the last leaf of its previous sibling.
            previous = previous.lastLeaf();
        } else if (node.parent !== this) {
            // If it has no previous sibling then climb up to the parent.
            // This is similar to `previous` but can't go further than `this`.
            previous = node.ancestor();
        }
        return previous;
    }
    /**
     * Return the descendant of this node that directly follows the given node
     * in depth-first pre-order traversal.
     *
     * @param node
     */
    _descendantAfter(node: VNode): TNode {
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
     *
     * @param child
     * @param index The index at which the insertion must take place within this
     * VNode's parent, holding marker nodes into account.
     */
    _insertAtIndex(child: VNode, index: number): void {
        if (child.parent) {
            const currentIndex = child.parent.childVNodes.indexOf(child);
            if (index && child.parent === this && currentIndex < index) {
                index--;
            }
            child.parent.removeChild(child);
        }
        this.childVNodes.splice(index, 0, child);
        child.parent = this;
    }
    /**
     * Remove the nth child from this node.
     *
     * @param index The index of the child to remove including marker nodes.
     */
    _removeAtIndex(index: number): void {
        const child = this.childVNodes.splice(index, 1)[0];
        child.parent = undefined;
    }
}
