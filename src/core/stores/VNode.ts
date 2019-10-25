import { BasicHtmlRenderingEngine, RenderingEngine } from '../utils/BasicHtmlRenderingEngine';

type TraversalPredicate = (next: VNode, lastSeen: VNode) => boolean;

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
    UNKNOWN = 'UNKNOWN',
}

export interface VNodeProperties {
    atomic: boolean;
}

export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
}

const atomicTypes = [
    VNodeType.CHAR,
    VNodeType.LINE_BREAK,
    VNodeType.RANGE_START,
    VNodeType.RANGE_END,
];
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
    properties: VNodeProperties = {
        atomic: false,
    };
    _childrenMap: Map<VNode, number> = new Map<VNode, number>();

    constructor(type = VNodeType.UNKNOWN, originalTag = '', value?: string, format?: FormatType) {
        this.type = type;
        this.originalTag = originalTag;
        this.value = value;
        this.format = format || {
            bold: false,
            italic: false,
            underlined: false,
        };
        this._updateProperties();
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
     * instead of a plain traversal.
     *
     * @param vNode
     */
    isBefore(vNode: VNode): boolean {
        const next = this.next();
        const previousVNode = vNode.previous();
        if (next && next.id !== vNode.id && previousVNode && previousVNode.id !== next.id) {
            return next.isBefore(previousVNode);
        } else {
            return !!next && !!previousVNode;
        }
    }
    /**
     * Return true if this VNode comes after the given VNode in the pre-order
     * traversal.
     *
     * TODO: Make a less naive version of this, performing an efficient search
     * instead of a plain traversal.
     *
     * @param vNode
     */
    isAfter(vNode: VNode): boolean {
        return vNode.isBefore(this);
    }
    /**
     * Return true if this VNode has a properties property set to true.
     */
    hasProperties(): boolean {
        return Object.keys(this.properties).some(
            (key: keyof VNodeProperties): boolean => !!this.properties[key],
        );
    }

    //--------------------------------------------------------------------------
    // Browsing
    //--------------------------------------------------------------------------

    /**
     * Return this VNode's first child.
     */
    get firstChild(): VNode {
        return this.nthChild(0);
    }
    /**
     * Return this VNode's last child.
     */
    get lastChild(): VNode {
        return this.nthChild(this.children.length - 1);
    }
    /**
     * Return this VNode's first deepest descendent.
     */
    get firstLeaf(): VNode {
        return this._getLeaf('first');
    }
    /**
     * Return this VNode's last deepest descendent.
     */
    get lastLeaf(): VNode {
        return this._getLeaf('last');
    }
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
     * Return this VNode's siblings.
     */
    get siblings(): VNode[] {
        return (this.parent && this.parent.children) || [];
    }
    /**
     * Return this VNode's next sibling.
     *
     */
    get previousSibling(): VNode {
        return this.parent && this.parent.childBefore(this);
    }
    /**
     * Return this VNode's next sibling.
     */
    get nextSibling(): VNode {
        return this.parent && this.parent.childAfter(this);
    }
    /**
     * Return the previous node in a depth-first pre-order traversal of the
     * tree. If a predicate is passed, loop this until it returns true.
     *
     * @param [predicate]
     */
    previous(predicate?: TraversalPredicate): VNode {
        return this._traverse('previous', predicate);
    }
    /**
     * Return the next node in a depth-first pre-order traversal of the tree. If
     * a predicate is passed, loop this until it returns true.
     *
     * @param [predicate]
     */
    next(predicate?: TraversalPredicate): VNode {
        return this._traverse('next', predicate);
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
     * Return this VNode's first/last deepest descendent.
     *
     * @param position
     */
    _getLeaf(position: 'first' | 'last'): VNode {
        if (!this.children.length) {
            return this;
        }
        const methodName = position === 'first' ? 'firstChild' : 'lastChild';
        let leaf = this[methodName];
        while (leaf && leaf[methodName]) {
            leaf = leaf[methodName];
        }
        return leaf;
    }
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
     * Return the previous/next node in a depth-first pre-order traversal of the
     * tree. If a predicate is passed, loop this until it returns true.
     *
     * @param direction
     * @param [predicate]
     */
    _traverse(direction: 'previous' | 'next', predicate?: TraversalPredicate): VNode {
        const methodName = direction === 'previous' ? '_walkPrevious' : '_walkNext';
        let next = this[methodName]();
        let lastSeen;
        while (predicate && next && !predicate(next, lastSeen || this)) {
            lastSeen = next;
            next = next[methodName]();
        }
        return next;
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
    /**
     * Update the VNode's properties.
     */
    _updateProperties(): void {
        if (atomicTypes.includes(this.type)) {
            this.properties.atomic = true;
        }
    }
    /**
     * Return the next node in a depth-first pre-order traversal of the tree.
     */
    _walkNext(): VNode {
        if (this.firstChild) {
            return this.firstChild;
        } else if (this.nextSibling) {
            return this.nextSibling;
        } else {
            let ancestor = this.parent;
            while (ancestor && !ancestor.nextSibling) {
                ancestor = ancestor.parent;
            }
            return ancestor && ancestor.nextSibling;
        }
    }
    /**
     * Return the previous node in a depth-first pre-order traversal of the
     * tree.
     */
    _walkPrevious(): VNode {
        if (this.previousSibling) {
            return this.previousSibling.lastLeaf;
        } else {
            return this.parent;
        }
    }
}
