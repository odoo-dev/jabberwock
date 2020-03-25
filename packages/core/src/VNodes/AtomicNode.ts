import { VNode, Predicate } from './VNode';
import { ChildNode } from './ChildNode';
import { AtomicityError } from '../../../utils/src/errors';

/**
 * This class provides typing overrides for multiple VNode methods which are
 * supposed to take parameters but that are unused in the case of atomic nodes.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class AtomicNode extends ChildNode {
    static test(node: VNode): boolean {
        return node && node.test(this);
    }

    readonly atomic: true = true;
    get childVNodes(): [] {
        return [];
    }

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

    /**
     * See {@link VNode.children}.
     *
     * @return Returns an empty array since an atomic node cannot have children.
     */
    children<T extends VNode>(predicate?: Predicate<T>): [];
    children(predicate?: Predicate): [];
    children<T>(predicate?: Predicate<T>): [] {
        return [];
    }
    /**
     * See {@link VNode.hasChildren}.
     *
     * @return Returns `false` since an atomic node cannot have children.
     */
    hasChildren(): false {
        return false;
    }
    /**
     * See {@link VNode.nthChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    nthChild(n: number): undefined {
        return undefined;
    }
    /**
     * See {@link VNode.length}.
     *
     * @return Returns 1 since an atomic node cannot have children.
     */
    get length(): 1 {
        return 1;
    }
    /**
     * See {@link VNode.firstChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    firstChild<T extends VNode>(predicate?: Predicate<T>): undefined;
    firstChild<T>(predicate?: Predicate<T>): undefined;
    firstChild<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link VNode.lastChild}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    lastChild<T extends VNode>(predicate?: Predicate<T>): undefined;
    lastChild<T>(predicate?: Predicate<T>): undefined;
    lastChild<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link VNode.firstLeaf}.
     *
     * @return Returns `this` since an atomic node cannot have children.
     */
    firstLeaf<T extends VNode>(predicate?: Predicate<T>): this;
    firstLeaf<T>(predicate?: Predicate<T>): this;
    firstLeaf<T>(predicate?: Predicate<T>): this {
        return this;
    }
    /**
     * See {@link VNode.lastLeaf}.
     *
     * @return Returns `this` since an atomic node cannot have children.
     */
    lastLeaf<T extends VNode>(predicate?: Predicate<T>): this;
    lastLeaf<T>(predicate?: Predicate<T>): this;
    lastLeaf<T>(predicate?: Predicate<T>): this {
        return this;
    }
    /**
     * See {@link VNode.firstDescendant}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    firstDescendant<T extends VNode>(predicate?: Predicate<T>): undefined;
    firstDescendant<T>(predicate?: Predicate<T>): undefined;
    firstDescendant<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link VNode.lastDescendant}.
     *
     * @return Returns `undefined` since an atomic node cannot have children.
     */
    lastDescendant<T extends VNode>(predicate?: Predicate<T>): undefined;
    lastDescendant<T>(predicate?: Predicate<T>): undefined;
    lastDescendant<T>(predicate?: Predicate<T>): undefined {
        return undefined;
    }
    /**
     * See {@link VNode.descendants}.
     *
     * @return Returns an empty array since an atomic node cannot have children.
     */
    descendants<T extends VNode>(predicate?: Predicate<T>): [];
    descendants<T>(predicate?: Predicate<T>): [];
    descendants<T>(predicate?: Predicate<T>): [] {
        return [];
    }

    //--------------------------------------------------------------------------
    // Updating
    //--------------------------------------------------------------------------

    /**
     * See {@link VNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    prepend(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link VNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    append(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
   /**
     * See {@link VNode.insertBefore}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertBefore(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link VNode.insertAfter}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertAfter(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link VNode.empty}.
     */
    empty(): void {
        return;
    }
    /**
     * See {@link VNode.removeChild}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    removeChild(child: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link VNode.splitAt}.
     *
     * @throws AtomicityError An atomic node cannot be split.
     */
    splitAt(child: VNode): this {
        throw new AtomicityError(this);
    }
    /**
     * See {@link VNode.mergeWith}.
     */
    mergeWith(newContainer: VNode): void {
        return;
    }
    /**
     * See {@link VNode.unwrap}.
     */
    unwrap(): void {
        return;
    }
}
