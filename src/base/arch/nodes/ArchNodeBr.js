(function () {
'use strict';

we3.ArchNodeBr = class extends we3.ArchNode {
    get type () {
        return 'br';
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    addLine () {
        this.parent.addLine(this.index() + 1);
    }
    /**
     * @override
     */
    isBR () {
        return true;
    }
    /**
     * @override
     */
    isInvisibleBR () {
        if (this.isPlaceholderBR() || this.nextSibling()) {
            return false;
        }
        var prev = this.previousSibling();
        return !prev || !prev.isBR();
    }
    /**
     * @override
     */
    isPlaceholderBR () {
        return this.parent.childNodes.length === 1;
    }
    /**
     * @override
     */
    isVisibleBR () {
        return !this.isInvisibleBR();
    }
    /**
     * @override
     */
    insert (archNode, offset) {
        if (archNode.isFragment()) {
            return this._insertFragment(archNode, offset);
        }
        if (archNode.isBR()) {
            this.params.change(archNode, archNode.length());
            return this.after(archNode);
        }
        var prev = this.previousSibling();
        var isPrevInvisibleEmpty = prev && prev.isEmpty() &&
            (!prev.isText() || prev.isVirtual());
        var isPrevInlineVoidoid = prev && prev.isVoidoid() && prev.isInline();
        if (archNode.isVirtual() || (archNode.isInline() &&
            ( !prev || isPrevInlineVoidoid || isPrevInvisibleEmpty ))) {
            this.params.change(archNode, archNode.length());
            var res = this.before(archNode);
            this.remove();
            return res;
        }
        return this.parent.insert(archNode, this.index() + 1);
    }
    /**
     * @override
     */
    removeLeft () {
        return this._removeSide(true);
    }
    /**
     * @override
     */
    removeRight () {
        return this._removeSide(false);
    }
    /**
     * @override
     */
    split () {
        return;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _applyRulesArchNode () {
        var prev = this.previousSibling();
        if (prev && prev.isText() && this.isRightEdgeOfBlock()) {
            // add a BR to make this one visible
            var extraBR = this.params.create('br');
            this.before(extraBR);
        }
    }
    /**
     * Remove the BR's first block ancestor.
     *
     * @private
     * @param {ArchNode} block
     * @returns {ArchNode|undefined} the node that will be focused after removing, if any
     */
    _removeBlockAncestor (block) {
        var options = {
            doNotInsertVirtual: function () { return true; },
        };
        var prev = block.prev(options);
        var next = block.next(options);
        var parent = block.parent;
        if (block.parent.isRoot() && block.parent.isDeepEmpty()) {
            return;
        }
        block.remove();
        return next || prev || parent;
    }
    /**
     * Remove an empty node and all its empty ancestors.
     *
     * @private
     * @param {ArchNode} node
     * @returns {ArchNode} the first non-removed ancestor, or the root.
     */
    _removeEmptyAncestors (node) {
        var parent;
        var root = node.ancestor('isRoot');
        while (node && node.isDeepEmpty() && !node.isRoot() && !node.firstLeaf().isBR()) {
            parent = node.parent;
            node.remove();
            node = parent;
        };
        return parent || root;
    }
    /**
     * Remove to the side of the BR, respecting visibility constraints.
     *
     * @private
     * @param {boolean} isLeft
     */
    _removeSide (isLeft) {
        var parent = this.parent;
        var prev = this.previousSibling() && this.previousSibling().lastLeaf();
        var next = this.nextSibling() && this.nextSibling().firstLeaf();
        if (isLeft && this.isVisibleBR() && !prev && (!next || next.isBR()) ||
            !isLeft && (!next && prev || this.isPlaceholderBR())) {
            this.params.change(isLeft || !next ? this : next, 0);
            this.deleteEdge(isLeft);
            return;
        }
        if (!prev && next && next.isVirtual() && parent.length() === 2) {
            next.remove();
            prev = parent.previousSibling();
        }
        var nextRange = {};
        if (isLeft) {
            nextRange.node = next && !next.isBR() ? next : prev || parent;
            nextRange.offset = nextRange.node === prev ? prev.length() : 0;
        } else {
            nextRange.node = prev && !prev.isBR() ? prev : next || parent;
            nextRange.offset = nextRange.node === prev ? prev.length() : 0;
        }
        this.params.change(nextRange.node, nextRange.offset);
        this.remove();
        parent = this._removeEmptyAncestors(parent);
        (prev || next || parent).deleteEdge(!prev, {
            doNotBreakBlocks: true,
        });
        this.params.change(nextRange.node, nextRange.offset); // retrigger in case edges were deleted
        var nextToCheck = isLeft ? prev : next;
        if (nextToCheck && !nextToCheck.__removed && nextToCheck.isInvisibleBR()) {
            nextToCheck.remove();
        }
    }
};


})();