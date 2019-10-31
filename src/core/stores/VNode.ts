import { BasicHtmlRenderingEngine, RenderingEngine } from '../utils/BasicHtmlRenderingEngine';

export type Predicate = (node: VNode) => boolean;

export enum VNodeType {
    ROOT = 'ROOT',
    RANGE_START = 'RANGE_START',
    RANGE_END = 'RANGE_END',
    PARAGRAPH = 'PARAGRAPH',
    HEADING1 = 'HEADING1',
    HEADING2 = 'HEADING2',
    HEADING3 = 'HEADING3',
    HEADING4 = 'HEADING4',
    HEADING5 = 'HEADING5',
    HEADING6 = 'HEADING6',
    CHAR = 'CHAR',
    LINE_BREAK = 'LINE_BREAK',
}
export const RangeTypes = [VNodeType.RANGE_START, VNodeType.RANGE_END];
export const TextTypes = [VNodeType.CHAR, VNodeType.RANGE_START, VNodeType.RANGE_END];
export const ElementTypes = Object.keys(VNodeType).filter(t => !t.startsWith('RANGE'));

export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
}

let id = 0;

export class VNode {
    readonly type: VNodeType;
    children: VNode[] = [];
    format: FormatType;
    readonly id = id;
    parent: VNode | null = null;
    renderingEngines: Record<string, RenderingEngine> = {
        html: BasicHtmlRenderingEngine,
    };
    originalTag: string;
    value: string;
    _childrenMap: Map<VNode, number> = new Map<VNode, number>();

    constructor(type: VNodeType, originalTag = '', value?: string, format?: FormatType) {
        this.type = type;
        this.originalTag = originalTag;
        this.value = value;
        this.format = format || {
            bold: false,
            italic: false,
            underlined: false,
        };
        id++;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Render the VNode to the given format.
     *
     * @param to the name of the format to which we want to render (default: html)
     */
    render<T>(to = 'html'): T {
        return this.renderingEngines[to].render(this) as T;
    }

    //--------------------------------------------------------------------------
    // Properties
    //--------------------------------------------------------------------------

    /**
     * Return the length of this VNode.
     */
    get length(): number {
        return this.value ? this.value.length : this.children.length;
    }
    /**
     * Return the length of this node and all its descendents.
     *
     * @param __current
     */
    totalLength(__current = 0): number {
        __current += this.length;
        this.children.forEach((child: VNode): void => {
            if (child.children.length) {
                __current = child.totalLength(__current);
            }
        });
        return __current;
    }
    /**
     * Return the index of this VNode within its parent.
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
        const index = this._childrenMap.get(child);
        return typeof index === 'undefined' ? -1 : index;
    }
    /**
     * Return this VNode's inner text (concatenation of all descendent
     * char nodes values).
     *
     * @param __current
     */
    text(__current = ''): string {
        if (this.value) {
            __current += this.value;
        }
        this.children.forEach((child: VNode): void => {
            __current = child.text(__current);
        });
        return __current;
    }
    /**
     * Return true if this VNode has a format property set to true.
     */
    hasFormat(): boolean {
        return Object.keys(this.format).some(
            (key: keyof FormatType): boolean => !!this.format[key],
        );
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
     * Return the child's previous sibling.
     *
     * @param child
     */
    childBefore(child: VNode): VNode {
        return this.nthChild(this.indexOf(child) - 1);
    }
    /**
     * Return the child's next sibling.
     *
     * @param child
     */
    childAfter(child: VNode): VNode {
        return this.nthChild(this.indexOf(child) + 1);
    }
    /**
     * Return the child at given index.
     *
     * @param index
     */
    nthChild(index: number): VNode {
        return this.children[index];
    }
    /**
     * Return the descendant of this node that directly precedes the given node
     * in depth-first pre-order traversal.
     *
     * @param node
     */
    descendantBefore(node: VNode): VNode {
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
    descendantAfter(node: VNode): VNode {
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
            return !node.children.length && (!predicate || predicate(node));
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
            return !node.children.length && (!predicate || predicate(node));
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
            return firstDescendant.walk((node: VNode) => this.descendantAfter(node), predicate);
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
        while (lastDescendant && lastDescendant.children.length) {
            lastDescendant = lastDescendant.lastChild();
        }
        if (lastDescendant && predicate) {
            return lastDescendant.walk((node: VNode) => this.descendantBefore(node), predicate);
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
        const previousSibling = this.parent && this.parent.childBefore(this);
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
        const nextSibling = this.parent && this.parent.childAfter(this);
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
        return this._insertAtIndex(child, this.children.length);
    }
    /**
     * Insert the given node before the given reference (which is a child of
     * this VNode). Return self.
     *
     * @param node
     * @param reference
     */
    insertBefore(node: VNode, reference: VNode): VNode {
        const index = this.indexOf(reference);
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
        const index = this.indexOf(reference);
        if (index < 0) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        return this._insertAtIndex(node, index + 1);
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
        const index = this.indexOf(child);
        if (index < 0) {
            throw new Error('The given VNode is not a child of this VNode');
        }
        return this._removeAtIndex(index);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Insert a VNode at the given index within this VNode's children.
     * Return self.
     *
     * @param child
     * @param index
     */
    _insertAtIndex(child: VNode, index: number): VNode {
        if (child.parent) {
            const currentIndex = child.parent.indexOf(child);
            if (index && child.parent === this && currentIndex < index) {
                index--;
            }
            child.parent.removeChild(child);
        }
        this.children.splice(index, 0, child);
        child.parent = this;
        this._updateIndices();
        return this;
    }
    /**
     * Remove the nth child from this node. Return self.
     */
    _removeAtIndex(index: number): VNode {
        this.children.splice(index, 1);
        this._updateIndices();
        return this;
    }
    /**
     * Reset the indices of this node's children.
     */
    _updateIndices(): VNode {
        this.children.forEach((child: VNode, i: number) => {
            this._childrenMap.set(child, i);
        });
        return this;
    }
}
