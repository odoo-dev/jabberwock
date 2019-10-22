import { BasicHtmlRenderingEngine, RenderingEngine } from '../utils/BasicHtmlRenderingEngine';

type BrowsingCallback = (sibling: VNode, previous: VNode) => boolean | void;

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

export interface AnchorProperties {
    url: URL;
    target?: string;
}

export interface FormatType {
    anchor?: AnchorProperties | null;
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
    properties: VNodeProperties = {
        atomic: false,
    };
    _childrenMap: Map<VNode, number> = new Map<VNode, number>();

    constructor(type = VNodeType.UNKNOWN, originalTag = '', value?: string, format?: FormatType) {
        this.type = type;
        this.originalTag = originalTag;
        this.value = value;
        this.format = format || {
            anchor: null,
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
        return this._leaf('first');
    }
    /**
     * Return this VNode's last deepest descendent.
     */
    get lastLeaf(): VNode {
        return this._leaf('last');
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
     * Traverse all previous siblings until `callback` returns true. Return the
     * last encountered sibling.
     *
     * @param callback
     * @param skipRange true to skip range nodes
     */
    previousSiblings(callback: BrowsingCallback, skipRange = false): VNode {
        return this._walkSiblings('previous', callback, skipRange);
    }
    /**
     * Traverse all next siblings until `callback` returns true. Return the last
     * encountered sibling.
     *
     * @param callback
     * @param skipRange true to skip range nodes
     */
    nextSiblings(callback: BrowsingCallback, skipRange = false): VNode {
        return this._walkSiblings('next', callback, skipRange);
    }
    /**
     * Return the previous node in a depth-first pre-order traversal of the
     * tree.
     *
     * @param [__searchChildren]
     */
    previous(__searchChildren = false): VNode | null {
        if (__searchChildren) {
            return this.children.length ? this.lastChild.previous(true) : this;
        } else if (this.previousSibling) {
            return this.previousSibling.previous(true);
        } else if (this.parent) {
            return this.parent;
        } else {
            return null;
        }
    }
    /**
     * Return the next node in a depth-first pre-order traversal of the tree.
     *
     * @param [__index]
     */
    next(__index = 0): VNode | null {
        if (this.nthChild(__index)) {
            return this.nthChild(__index);
        } else if (this.parent) {
            return this.parent.next(this.index + 1);
        } else {
            return null;
        }
    }
    /**
     * Traverse the tree from this node to the previous, node by node, following
     * a depth-first pre-order, until the given callback returns true or no next
     * node could be found. Return the node for which the callback returned
     * true, if any.
     *
     * @param callback
     */
    previousUntil(callback: (previous: VNode) => boolean): VNode | null {
        const previous = this.previous();
        if (!previous || callback(previous)) {
            return previous;
        } else {
            return previous.previousUntil(callback);
        }
    }
    /**
     * Traverse the tree from this node to the next, node by node, following a
     * depth-first pre-order, until the given callback returns true or no next
     * node could be found. Return the node for which the callback returned
     * true, if any.
     *
     * @param callback
     */
    nextUntil(callback: (next: VNode) => boolean): VNode | null {
        const next = this.next();
        if (!next || callback(next)) {
            return next;
        } else {
            return next.nextUntil(callback);
        }
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
    remove(): VNode {
        return this.parent.removeChild(this);
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
     * Return this VNode's first/last deepest descendent.
     *
     * @param position
     */
    _leaf(position: 'first' | 'last'): VNode {
        const methodName = position === 'first' ? 'firstChild' : 'lastChild';
        let leaf = this[methodName];
        while (leaf && leaf[methodName]) {
            leaf = leaf[methodName];
        }
        return leaf || this;
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
    /**
     * Update the VNode's properties.
     */
    _updateProperties(): void {
        if (
            this.type === VNodeType.CHAR ||
            this.type === VNodeType.LINE_BREAK ||
            this.type.startsWith('RANGE')
        ) {
            this.properties.atomic = true;
        }
    }
    /**
     * Traverse all previous/next siblings until `callback` returns true. Return
     * the last encountered sibling.
     *
     * @param direction
     * @param callback
     * @param skipRange true to skip range nodes
     */
    _walkSiblings(
        direction: 'next' | 'previous',
        callback: BrowsingCallback,
        skipRange = false,
    ): VNode {
        const propName = direction === 'next' ? 'nextSibling' : 'previousSibling';
        let previous: VNode;
        let sibling = this[propName];
        let stop = false;
        while (sibling && !stop) {
            if (!skipRange || !sibling.type.startsWith('RANGE')) {
                stop = !!callback(sibling, previous || this);
            }
            if (stop) break;
            previous = sibling;
            sibling = sibling[propName];
        }
        return previous || this;
    }
}
