import { AbstractNode } from './AbstractNode';
import { VNode } from './VNode';
import { ChildError } from '../../../utils/src/errors';
import { VersionableArray } from '../Memory/VersionableArray';

export class ContainerNode extends AbstractNode {
    readonly childVNodes: VNode[] = new VersionableArray<VNode>();
    // Set to false if the container is not allowed to have other containers as
    // children.
    mayContainContainers = true;
    // By default if setted to null, a <br> are added if the node is editable.
    // This proprety can be overrited by the mode/rules.
    allowEmpty: boolean | void;

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
        this._ensureChild(reference);
        const parentVNode = reference.parentVNode;
        if (parentVNode !== this) {
            parentVNode.insertBefore(node, reference);
        } else {
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
        this._ensureChild(reference);
        const parentVNode = reference.parentVNode;
        if (parentVNode !== this) {
            parentVNode.insertAfter(node, reference);
        } else {
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
        this._ensureChild(child);
        const parentVNode = child.parentVNode;
        if (parentVNode !== this) {
            parentVNode.removeChild(child);
        } else {
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
            if (this.hasChildren()) {
                if (!this.breakable) {
                    console.warn(
                        `Cannot insert a container within a ${this.name}. ` +
                            'This container is not breakable.',
                    );
                    return;
                }

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
