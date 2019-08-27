export enum VNodeType {
    ROOT = 'ROOT',
    PARAGRAPH = 'PARAGRAPH',
    HEADER = 'HEADER',
    CHAR = 'CHAR',
}

export class VNode {
    readonly type: VNodeType;
    readonly children: VNode [];
    readonly index: number;
    readonly parent: VNode | null;
    readonly value: char | undefined;

    constructor (type: VNodeType, value?: string) {
        this.type = type;
        this.parent = null;
        this.children = [];
        this.index = 0;
        this.value = value;
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    get firstChild (): VNode | undefined {
        return this.nthChild(0);
    }
    get lastChild (): VNode | undefined {
        return this.nthChild(this.children.length - 1);
    }
    get nextSibling (): VNode | undefined {
        return this.parent && this.parent.nthChild(this.index + 1);
    }
    nthChild (index: number): VNode | undefined {
        return index >= 0 && this.children[index] || undefined;
    }
    get previousSibling (): VNode | undefined {
        return this.parent && this.parent.nthChild(this.index - 1);
    }
    get siblings (): VNode [] {
        return this.parent && this.parent.children || [];
    }

    //--------------------------------------------------------------------------
    // Public methods
    //--------------------------------------------------------------------------

    /**
     * Append a child to this node. Return self.
     */
    append (child: VNode): VNode {
        var index = this.children.length > 0 ? this.children.length : 0;
        child.setPosition(this, index);
        return this;
    }
    /**
     * Prepend a child to this node. Return self.
     */
    prepend (child: VNode) : VNode {
        child.setPosition(this, 0);
        return this;
    }
    /**
     * Remove the nth child from this node. Return self.
     */
    removeChild (index: number): VNode {
        delete this.children[index];
        this.children.splice(index);
        return this;
    }
    /**
     * Set the position of this node in the document: update references to other
     * nodes in this node, and to this node in other nodes.
     */
    setPosition (parent: VNode, index: number, children?: VNode []): VNode {
        if (this.parent) { // remove this from old parent
            this.parent.children.splice(this.index);
        }
        this.parent = parent;
        this.parent.children.splice(index, 0, this);
        this.index = index;
        this.children = children || this.children;
    }
}
