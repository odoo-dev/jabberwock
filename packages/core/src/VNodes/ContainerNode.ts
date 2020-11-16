import { AbstractNode } from './AbstractNode';
import { VNode, Predicate, isLeaf } from './VNode';
import { ChildError } from '../../../utils/src/errors';
import { VersionableArray } from '../Memory/VersionableArray';

export class ContainerNode extends AbstractNode {
    readonly childVNodes: VNode[] = new VersionableArray<VNode>();
    // Set to false if the container is not allowed to have other containers as
    // children.
    mayContainContainers = true;

    //--------------------------------------------------------------------------
    // Browsing children.
    //--------------------------------------------------------------------------

    /**
     * See {@link AbstractNode.children}.
     */
    children<T extends VNode>(predicate?: Predicate<T>): T[];
    children(predicate?: Predicate): VNode[];
    children(predicate?: Predicate): VNode[] {
        const children: VNode[] = [];
        const stack = [...this.childVNodes];
        while (stack.length) {
            const node = stack.shift();
            if (node.tangible) {
                if (!predicate || node.test(predicate)) {
                    children.push(node);
                }
            } else if (node instanceof ContainerNode) {
                stack.unshift(...node.childVNodes);
            }
        }
        return children;
    }
    /**
     * See {@link AbstractNode.hasChildren}.
     */
    hasChildren(): boolean {
        const stack = [...this.childVNodes];
        for (const child of stack) {
            if (child.tangible) {
                return true;
            } else if (child instanceof ContainerNode) {
                stack.push(...child.childVNodes);
            }
        }
        return false;
    }
    /**
     * See {@link AbstractNode.nthChild}.
     */
    nthChild(n: number): VNode {
        return this.children()[n - 1];
    }
    /**
     * See {@link AbstractNode.firstChild}.
     */
    firstChild<T extends VNode>(predicate?: Predicate<T>): T;
    firstChild(predicate?: Predicate): VNode;
    firstChild(predicate?: Predicate): VNode {
        let child = this.childVNodes[0];
        while (child instanceof ContainerNode && !child.tangible && child.childVNodes.length) {
            child = child.childVNodes[0];
        }
        while (child && !(child.tangible && (!predicate || child.test(predicate)))) {
            child = child.nextSibling();
        }
        return child;
    }
    /**
     * See {@link AbstractNode.lastChild}.
     */
    lastChild<T extends VNode>(predicate?: Predicate<T>): T;
    lastChild(predicate?: Predicate): VNode;
    lastChild(predicate?: Predicate): VNode {
        let child = this.childVNodes[this.childVNodes.length - 1];
        while (child instanceof ContainerNode && !child.tangible && child.childVNodes.length) {
            child = child.childVNodes[child.childVNodes.length - 1];
        }
        while (child && !(child.tangible && (!predicate || child.test(predicate)))) {
            child = child.previousSibling();
        }
        return child;
    }
    /**
     * See {@link AbstractNode.firstLeaf}.
     */
    firstLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    firstLeaf(predicate?: Predicate): VNode;
    firstLeaf(predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && (!predicate || node.test(predicate));
        };
        if (isValidLeaf(this)) {
            return this;
        } else {
            return this.firstDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * See {@link AbstractNode.lastLeaf}.
     */
    lastLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    lastLeaf(predicate?: Predicate): VNode;
    lastLeaf(predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return isLeaf(node) && (!predicate || node.test(predicate));
        };
        if (isValidLeaf(this)) {
            return this;
        } else {
            return this.lastDescendant((node: VNode) => isValidLeaf(node));
        }
    }
    /**
     * See {@link AbstractNode.firstDescendant}.
     */
    firstDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    firstDescendant(predicate?: Predicate): VNode;
    firstDescendant(predicate?: Predicate): VNode {
        let firstDescendant = this.firstChild();
        while (firstDescendant && predicate && !firstDescendant.test(predicate)) {
            firstDescendant = this._descendantAfter(firstDescendant);
        }
        return firstDescendant;
    }
    /**
     * See {@link AbstractNode.lastDescendant}.
     */
    lastDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    lastDescendant(predicate?: Predicate): VNode;
    lastDescendant(predicate?: Predicate): VNode {
        let lastDescendant = this.lastChild();
        while (lastDescendant && lastDescendant.hasChildren()) {
            lastDescendant = lastDescendant.lastChild();
        }
        while (lastDescendant && predicate && !lastDescendant.test(predicate)) {
            lastDescendant = this._descendantBefore(lastDescendant);
        }
        return lastDescendant;
    }
    /**
     * See {@link AbstractNode.descendants}.
     */
    descendants<T extends VNode>(predicate?: Predicate<T>): T[];
    descendants(predicate?: Predicate): VNode[];
    descendants(predicate?: Predicate): VNode[] {
        const descendants = [];
        const stack = [...this.childVNodes];
        while (stack.length) {
            const node = stack.shift();
            if (node.tangible && (!predicate || node.test(predicate))) {
                descendants.push(node);
            }
            if (node instanceof ContainerNode) {
                stack.unshift(...node.childVNodes);
            }
        }
        return descendants;
    }

    //--------------------------------------------------------------------------
    // Updating
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(deepClone?: boolean, params?: {}): this {
        const clone = super.clone(params);
        if (deepClone) {
            for (const child of this.childVNodes) {
                clone.append(child.clone(true));
            }
        }
        return clone;
    }
    /**
     * See {@link AbstractNode.prepend}.
     */
    prepend(...children: VNode[]): void {
        for (const child of children) {
            this._insertAtIndex(child, 0);
        }
        if (children.find(child => child.tangible)) {
            this.trigger('childList');
        }
    }
    /**
     * See {@link AbstractNode.append}.
     */
    append(...children: VNode[]): void {
        for (const child of children) {
            this._insertAtIndex(child, this.childVNodes.length);
        }
        if (children.find(child => child.tangible)) {
            this.trigger('childList');
        }
    }
    /**
     * See {@link AbstractNode.insertBefore}.
     */
    insertBefore(node: VNode, reference: VNode): void {
        const parentVNode = reference.parentVNode;
        if (parentVNode !== this) {
            this._ensureChild(parentVNode);
            parentVNode.insertBefore(node, reference);
        } else {
            this._ensureChild(reference);
            const index = this.childVNodes.indexOf(reference);
            this._insertAtIndex(node, index);
            if (node.tangible) {
                this.trigger('childList');
            }
        }
    }
    /**
     * See {@link AbstractNode.insertAfter}.
     */
    insertAfter(node: VNode, reference: VNode): void {
        const parentVNode = reference.parentVNode;
        if (parentVNode !== this) {
            this._ensureChild(parentVNode);
            parentVNode.insertAfter(node, reference);
        } else {
            this._ensureChild(reference);
            const index = this.childVNodes.indexOf(reference);
            this._insertAtIndex(node, index + 1);
            if (node.tangible) {
                this.trigger('childList');
            }
        }
    }
    /**
     * See {@link AbstractNode.empty}.
     */
    empty(): void {
        for (const child of [...this.childVNodes]) {
            child.remove();
        }
    }
    /**
     * See {@link AbstractNode.removeChild}.
     */
    removeChild(child: VNode): void {
        const parentVNode = child.parentVNode;
        if (parentVNode !== this) {
            this._ensureChild(parentVNode);
            parentVNode.removeChild(child);
        } else {
            this._ensureChild(child);
            const index = this.childVNodes.indexOf(child);
            this._removeAtIndex(index);
        }
    }
    /**
     * See {@link AbstractNode.splitAt}.
     */
    splitAt(child: VNode): this {
        this._ensureChild(child);
        while (child.parentVNode !== this) {
            // If the child is in not tangible container.
            const parentVNode = child.parentVNode;
            child = parentVNode.splitAt(child);
        }
        const duplicate = this.clone();
        const index = this.childVNodes.indexOf(child);
        const children = this.childVNodes.splice(index);
        duplicate.childVNodes.push(...children);
        for (const child of children) {
            child.parentVNode = duplicate;
        }
        this.after(duplicate);
        return duplicate;
    }
    /**
     * See {@link AbstractNode.mergeWith}.
     */
    mergeWith(newContainer: VNode): void {
        if (newContainer !== this) {
            if (newContainer.childVNodes.includes(this)) {
                for (const child of this.childVNodes.slice()) {
                    newContainer.insertBefore(child, this);
                }
            } else {
                newContainer.append(...this.childVNodes);
            }
            this.remove();
        }
    }
    /**
     * See {@link AbstractNode.unwrap}.
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
     *
     * @param child
     * @param index The index at which the insertion must take place within this
     * VNode's parentVNode, holding marker nodes into account.
     */
    _insertAtIndex(child: VNode, index: number): void {
        // TODO: FIX: remove `this.parentVNode` is a hack so it will go
        // directly to `else` when parsing. But it's false to have a div in a p
        // when whe parse the DOM.
        if (
            this.parentVNode &&
            !this.mayContainContainers &&
            child instanceof ContainerNode &&
            (child.tangible || child.children(ContainerNode).length)
        ) {
            if (!this.parentVNode) {
                console.warn(
                    `Cannot insert a container within a ${this.name}. ` +
                        'This container having no parent, can also not be split.',
                );
                return;
            }
            if (!this.breakable) {
                console.warn(
                    `Cannot insert a container within a ${this.name}. ` +
                        'This container is not breakable.',
                );
                return;
            }
            if (this.hasChildren()) {
                const childAtIndex = this.childVNodes[index];
                const duplicate = childAtIndex && this.splitAt(childAtIndex);
                if (!this.hasChildren()) {
                    this.replaceWith(child);
                } else if (duplicate && !duplicate.hasChildren()) {
                    duplicate.replaceWith(child);
                } else {
                    this.after(child);
                }
            } else {
                this.replaceWith(child);
            }
        } else {
            const parentVNode = child.parentVNode;
            if (parentVNode) {
                const currentIndex = parentVNode.childVNodes.indexOf(child);
                if (index && parentVNode === this && currentIndex < index) {
                    index--;
                }
                parentVNode.removeChild(child);
            }
            this.childVNodes.splice(index, 0, child);
            child.parentVNode = this;
        }
    }
    /**
     * Remove the direct nth child from this node.
     *
     * @param index The index of the child to remove including marker nodes.
     */
    _removeAtIndex(index: number): void {
        const child = this.childVNodes.splice(index, 1)[0];
        if (child.tangible) {
            this.trigger('childList');
        }
        child.modifiers.off('update');
        child.parentVNode = undefined;
    }
    /**
     * Throw a child error if the node is not a children (or a children of an
     * not tangible child)
     *
     * @param child
     */
    private _ensureChild(child: VNode): void {
        let parentVNode = child.parentVNode;
        while (parentVNode && parentVNode !== this && !parentVNode.tangible) {
            parentVNode = parentVNode.parentVNode;
        }
        if (parentVNode !== this) {
            throw new ChildError(this, child);
        }
    }
}
