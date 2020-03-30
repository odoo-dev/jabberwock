import { AbstractNode } from './AbstractNode';
import { VNode, Predicate } from './VNode';
import { AtomicityError } from '../../../utils/src/errors';

/**
 * This class provides typing overrides for multiple VNode methods which are
 * supposed to take parameters but that are unused in the case of atomic nodes.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class AtomicNode extends AbstractNode {
    get childVNodes(): VNode[] {
        return [];
    }

    //--------------------------------------------------------------------------
    // Browsing children.
    //--------------------------------------------------------------------------

    /**
     * See {@link AbstractNode.children}.
     *
     * @return Returns an empty array since an atomic node cannot have children.
     */
    children<T extends VNode>(predicate?: Predicate<T>): VNode[];
    children(predicate?: Predicate): VNode[];
    children<T>(predicate?: Predicate<T>): VNode[] {
        return [];
    }
    /**
     * See {@link AbstractNode.hasChildren}.
     *
     * @return Returns `false` since an atomic node cannot have children.
     */
    hasChildren(): false {
        return false;
    }
    /**
     * See {@link AbstractNode.nthChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    nthChild(n: number): undefined {
        return undefined;
    }
    /**
     * See {@link AbstractNode.firstChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    firstChild<T extends VNode>(predicate?: Predicate<T>): undefined;
    firstChild<T>(predicate?: Predicate<T>): undefined;
    firstChild<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link AbstractNode.lastChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    lastChild<T extends VNode>(predicate?: Predicate<T>): undefined;
    lastChild<T>(predicate?: Predicate<T>): undefined;
    lastChild<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link AbstractNode.firstLeaf}.
     *
     * @return Returns `this` since an atomic node cannot have children.
     */
    firstLeaf<T extends VNode>(predicate?: Predicate<T>): this;
    firstLeaf<T>(predicate?: Predicate<T>): this;
    firstLeaf<T>(predicate?: Predicate<T>): this {
        return this;
    }
    /**
     * See {@link AbstractNode.lastLeaf}.
     *
     * @return Returns `this` since an atomic node cannot have children.
     */
    lastLeaf<T extends VNode>(predicate?: Predicate<T>): this;
    lastLeaf<T>(predicate?: Predicate<T>): this;
    lastLeaf<T>(predicate?: Predicate<T>): this {
        return this;
    }
    /**
     * See {@link AbstractNode.firstDescendant}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    firstDescendant<T extends VNode>(predicate?: Predicate<T>): undefined;
    firstDescendant<T>(predicate?: Predicate<T>): undefined;
    firstDescendant<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link AbstractNode.lastDescendant}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    lastDescendant<T extends VNode>(predicate?: Predicate<T>): undefined;
    lastDescendant<T>(predicate?: Predicate<T>): undefined;
    lastDescendant<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link AbstractNode.descendants}.
     *
     * @return Returns an empty array since an atomic node cannot have children.
     */
    descendants<T extends VNode>(predicate?: Predicate<T>): VNode[];
    descendants<T>(predicate?: Predicate<T>): VNode[];
    descendants<T>(predicate?: Predicate<T>): VNode[] {
        return [];
    }

    //--------------------------------------------------------------------------
    // Updating children.
    //--------------------------------------------------------------------------

    /**
     * See {@link AbstractNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    prepend(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    append(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
   /**
     * See {@link AbstractNode.insertBefore}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertBefore(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.insertAfter}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertAfter(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.empty}.
     */
    empty(): void {
        return;
    }
    /**
     * See {@link AbstractNode.removeChild}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    removeChild(child: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.splitAt}.
     *
     * @throws AtomicityError An atomic node cannot be split.
     */
    splitAt(child: VNode): this {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.mergeWith}.
     */
    mergeWith(newContainer: VNode): void {
        return;
    }
    /**
     * See {@link AbstractNode.unwrap}.
     */
    unwrap(): void {
        return;
    }
}
