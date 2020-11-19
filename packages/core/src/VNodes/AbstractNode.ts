import { VNode, RelativePosition, Predicate } from './VNode';
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
import { withoutIntangibles } from '../Walker';

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
        return withoutIntangibles.parent(this as VNode);
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
     * See {@link Walker.testPredicate}.
     */
    test(predicate?: Predicate): boolean {
        return withoutIntangibles.test(this as VNode, predicate);
    }
    /**
     * See {@link Walker.isBefore}.
     */
    isBefore(vNode: VNode): boolean {
        return withoutIntangibles.isBefore(this as VNode, vNode);
    }
    /**
     * See {@link Walker.isAfter}.
     */
    isAfter(vNode: VNode): boolean {
        return withoutIntangibles.isAfter(this as VNode, vNode);
    }

    //--------------------------------------------------------------------------
    // Browsing ancestors and siblings.
    //--------------------------------------------------------------------------

    /**
     * See {@link Walker.closest}.
     */
    closest<T extends VNode>(predicate: Predicate<T>): T;
    closest(predicate: Predicate): VNode;
    closest(predicate: Predicate): VNode {
        return withoutIntangibles.closest(this as VNode, predicate);
    }
    /**
     * See {@link Walker.ancestor}.
     */
    ancestor<T extends VNode>(predicate?: Predicate<T>): T;
    ancestor(predicate?: Predicate): ContainerNode;
    ancestor(predicate?: Predicate): ContainerNode {
        return withoutIntangibles.ancestor(this as VNode, predicate);
    }
    /**
     * See {@link Walker.ancestors}.
     */
    ancestors<T extends VNode>(predicate?: Predicate<T>): T[];
    ancestors(predicate?: Predicate): ContainerNode[];
    ancestors(predicate?: Predicate): ContainerNode[] {
        return withoutIntangibles.ancestors(this as VNode, predicate);
    }
    /**
     * See {@link Walker.commonAncestor}.
     */
    commonAncestor<T extends VNode>(node: VNode, predicate?: Predicate<T>): T;
    commonAncestor(node: VNode, predicate?: Predicate): ContainerNode;
    commonAncestor(node: VNode, predicate?: Predicate): ContainerNode {
        return withoutIntangibles.commonAncestor(this as VNode, node, predicate);
    }
    /**
     * See {@link Walker.siblings}.
     */
    siblings<T extends VNode>(predicate?: Predicate<T>): T[];
    siblings(predicate?: Predicate): VNode[];
    siblings(predicate?: Predicate): VNode[] {
        return withoutIntangibles.siblings(this as VNode, predicate);
    }
    /**
     * See {@link Walker.adjacents}.
     */
    adjacents<T extends VNode>(predicate?: Predicate<T>): T[];
    adjacents(predicate?: Predicate): VNode[];
    adjacents(predicate?: Predicate): VNode[] {
        return withoutIntangibles.adjacents(this as VNode, predicate);
    }
    /**
     * See {@link Walker.previousSibling}.
     */
    previousSibling<T extends VNode>(predicate?: Predicate<T>): T;
    previousSibling(predicate?: Predicate): VNode;
    previousSibling(predicate?: Predicate): VNode {
        return withoutIntangibles.previousSibling(this as VNode, predicate);
    }
    /**
     * See {@link Walker.nextSibling}.
     */
    nextSibling<T extends VNode>(predicate?: Predicate<T>): T;
    nextSibling(predicate?: Predicate): VNode;
    nextSibling(predicate?: Predicate): VNode {
        return withoutIntangibles.nextSibling(this as VNode, predicate);
    }
    /**
     * See {@link Walker.previous}.
     */
    previous<T extends VNode>(predicate?: Predicate<T>): T;
    previous(predicate?: Predicate): VNode;
    previous(predicate?: Predicate): VNode {
        return withoutIntangibles.previous(this as VNode, predicate);
    }
    /**
     * See {@link Walker.next}.
     */
    next<T extends VNode>(predicate?: Predicate<T>): T;
    next(predicate?: Predicate): VNode;
    next(predicate?: Predicate): VNode {
        return withoutIntangibles.next(this as VNode, predicate);
    }
    /**
     * See {@link Walker.previousLeaf}.
     */
    previousLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    previousLeaf(predicate?: Predicate): VNode;
    previousLeaf(predicate?: Predicate): VNode {
        return withoutIntangibles.previousLeaf(this as VNode, predicate);
    }
    /**
     * See {@link Walker.nextLeaf}.
     */
    nextLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    nextLeaf(predicate?: Predicate): VNode;
    nextLeaf(predicate?: Predicate): VNode {
        return withoutIntangibles.nextLeaf(this as VNode, predicate);
    }
    /**
     * See {@link Walker.previousSiblings}.
     */
    previousSiblings<T extends VNode>(predicate?: Predicate<T>): T[];
    previousSiblings(predicate?: Predicate): VNode[];
    previousSiblings(predicate?: Predicate): VNode[] {
        return withoutIntangibles.previousSiblings(this as VNode, predicate);
    }
    /**
     * See {@link Walker.nextSiblings}.
     */
    nextSiblings<T extends VNode>(predicate?: Predicate<T>): T[];
    nextSiblings(predicate?: Predicate): VNode[];
    nextSiblings(predicate?: Predicate): VNode[] {
        return withoutIntangibles.nextSiblings(this as VNode, predicate);
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
    // Browsing children.
    //--------------------------------------------------------------------------

    /**
     * See {@link Walker.children}.
     */
    children<T extends VNode>(predicate?: Predicate<T>): T[];
    children(predicate?: Predicate): VNode[];
    children(predicate?: Predicate): VNode[] {
        return withoutIntangibles.children(this as VNode, predicate);
    }
    /**
     * See {@link Walker.hasChildren}.
     */
    hasChildren(): boolean {
        return withoutIntangibles.hasChildren(this);
    }
    /**
     * See {@link Walker.nthChild}.
     */
    nthChild(n: number): VNode {
        return withoutIntangibles.nthChild(this, n);
    }
    /**
     * See {@link Walker.firstChild}.
     */
    firstChild<T extends VNode>(predicate?: Predicate<T>): T;
    firstChild(predicate?: Predicate): VNode;
    firstChild(predicate?: Predicate): VNode {
        return withoutIntangibles.firstChild(this as VNode, predicate);
    }
    /**
     * See {@link Walker.lastChild}.
     */
    lastChild<T extends VNode>(predicate?: Predicate<T>): T;
    lastChild(predicate?: Predicate): VNode;
    lastChild(predicate?: Predicate): VNode {
        return withoutIntangibles.lastChild(this as VNode, predicate);
    }
    /**
     * See {@link Walker.firstLeaf}.
     */
    firstLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    firstLeaf(predicate?: Predicate): VNode;
    firstLeaf(predicate?: Predicate): VNode {
        return withoutIntangibles.firstLeaf(this as VNode, predicate);
    }
    /**
     * See {@link Walker.lastLeaf}.
     */
    lastLeaf<T extends VNode>(predicate?: Predicate<T>): T;
    lastLeaf(predicate?: Predicate): VNode;
    lastLeaf(predicate?: Predicate): VNode {
        return withoutIntangibles.lastLeaf(this as VNode, predicate);
    }
    /**
     * See {@link Walker.descendants}.
     */
    descendants<T extends VNode>(predicate?: Predicate<T>): T[];
    descendants(predicate?: Predicate): VNode[];
    descendants(predicate?: Predicate): VNode[] {
        return withoutIntangibles.descendants(this as VNode, predicate);
    }

    /**
     * See {@link Walker.firstDescendant}.
     */
    firstDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    firstDescendant(predicate?: Predicate): VNode;
    firstDescendant(predicate?: Predicate): VNode {
        return withoutIntangibles.firstDescendant(this as VNode, predicate);
    }
    /**
     * See {@link Walker.lastDescendant}.
     */
    lastDescendant<T extends VNode>(predicate?: Predicate<T>): T;
    lastDescendant(predicate?: Predicate): VNode;
    lastDescendant(predicate?: Predicate): VNode {
        return withoutIntangibles.lastDescendant(this as VNode, predicate);
    }
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
