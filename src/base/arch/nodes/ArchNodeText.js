(function () {
'use strict';

we3.ArchNodeText = class extends we3.ArchNode {
    get type () {
        return 'TEXT';
    }

    /**
     * @override
     */
    addLine (offset) {
        if (!this.isAllowUpdate()) {
            console.warn("cannot split a not editable node");
            return;
        }

        var next = this.split(offset) || this.nextSibling() || this;
        this.nodeValue = this.nodeValue.replace(/ $/, '\u00A0');
        next.nodeValue = next.nodeValue.replace(/^ /, '\u00A0');
        if (next.isRightEdge()) {
            this.params.change(next, 0);
        }
        return this.parent.addLine(next.index());
    }
    /**
     * @override
     */
    empty () {
        this.setNodeValue('');
    }
    /**
     * @override
     */
    insert (archNode, offset) {
        if (!this.isAllowUpdate()) {
            console.warn("cannot split a not editable node");
            return [];
        }
        if (archNode.isFragment()) {
            return this._insertFragment(archNode, offset);
        }

        if (archNode.isText() && !archNode.isVirtual()) {
            this._insertTextInText(archNode.nodeValue, offset);
            var newOffset = offset + archNode.length();
            archNode.remove();
            this.params.change(this, newOffset);
            return [this];
        }

        var next = this.split(offset);
        var res = this.parent.insert(archNode, next.index());
        if (next.isEmpty()) {
            next.remove();
        }
        return res;
    }
    /**
     * @override
     */
    isBlankNode () {
        return false;
    }
    /**
     * @override
     */
    isBlankText () {
        return false;
    }
    /**
     * Return true if the node is editable.
     *
     * @returns {Boolean}
     */
    isEditable () {
        return !this.parent || this.parent.isEditable();
    }
    /**
     * @override
     */
    isElement () {
        return false;
    }
    /**
     * @override
     */
    isEmpty () {
        return !this.nodeValue.length;
    }
    /**
     * @override
     */
    isInline () {
        return true;
    }
    /**
     * @override
     */
    isNodeBlockType () {
        return false;
    }
    /**
     * @override
     */
    isText () {
        return true;
    }
    /**
     * @override
     */
    isVisibleText () {
        return true;
    }
    /**
     * @override
     */
    length () {
        return this.nodeValue.length;
    }
    /**
     * @override
     */
    removeLeft (offset) {
        return this._removeSide(offset, true);
    }
    /**
     * @override
     */
    removeRight (offset) {
        return this._removeSide(offset, false);
    }
    setNodeValue (nodeValue) {
        if (!this.isAllowUpdate()) {
            console.warn("can not update a not editable node");
            return [];
        }

        this.nodeValue = nodeValue;
        this.params.change(this, nodeValue.length);
        return [];
    }
    /**
     * @override
     */
    split (offset) {
        if (!this.isAllowUpdate()) {
            console.warn("cannot split a non editable node");
            return;
        }

        var text = this.nodeValue.slice(offset);
        var archNode;

        if (offset === 0) {
            this.params.change(this, 0);
            archNode = this.params.create();
            this.before(archNode);
            return this;
        }

        if (text.length) {
            archNode = this.params.create(this.nodeName, this.attributes, text, this.type);
        } else {
            archNode = this.params.create();
        }
        this.params.change(archNode, 0); // set the last change to move range automatically

        this.nodeValue = this.nodeValue.slice(0, offset);
        this.params.change(this, offset);

        this.after(archNode);
        return archNode;
    }
    /**
     * @override
     */
    toString (options) {
        options = options || {};
        if (this.isVirtual() && !options.keepVirtual) {
            return '';
        }
        if (options.showIDs) {
            if (this.isVirtual()) {
                return '[virtual archID="' + this.id + '"/]';
            }
            return '[text archID="' + this.id + '"]' + this.nodeValue + '[/text]';
        }
        return this.nodeValue || '';
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _applyRulesArchNode () {
        if (this.nodeValue.length && this.isInPre()) {
            return super._applyRulesArchNode();
        }
        var text = this._removeFormatSpace();
        if (text.length) {
            text = this._handleNbsps(text);
            if (this.nodeValue !== text) {
                this.nodeValue = text;
                this.params.change(this, null);
            }
        } else {
            this.remove();
        }
    }
    /**
     * @override
     */
    _applyRulesPropagation () {}
    /**
     * Return a string  with clean handling of no-break spaces, which need to be replaced
     * by spaces when inserting next to them, while regular spaces can't ever be successive
     * or at the edges of a block.
     *
     * @param {String} text
     * @returns {String}
     */
    _handleNbsps (text) {
        if (this.isInPre()) {
            return text;
        }
        var startSpace = /^ /;
        var endSpace = / $/;
        var prevLeaf = this.prevUntil(node => !node.isVirtual(), {
            doNotInsertVirtual: true,
            leafToLeaf: true,
            stopAtBlock: true,
        });
        var isPrevBR = prevLeaf && prevLeaf.isBR();
        var isPrevEndsWithSpace = prevLeaf && endSpace.test(prevLeaf.nodeValue);
        var isLoose = this.parent.isRoot();
        var isLeftEdgeOfBlock = this.isLeftEdgeOfBlock(true);
        var isRightEdgeOfBlock = this.isRightEdgeOfBlock(true);

        text = text.replace(/\u00A0/g, ' ');
        if (isLeftEdgeOfBlock || isPrevBR || isPrevEndsWithSpace || isLoose) {
            text = text.replace(startSpace, '\u00A0');
        }
        if (isRightEdgeOfBlock || isLoose) {
            text = text.replace(endSpace, '\u00A0');
        }
        text = text.replace(/  /g, ' \u00A0');
        return text;
    }
    /**
     * Insert a string in a text node (this) at given offset.
     *
     * @param {String} text
     * @param {Number} offset
     */
    _insertTextInText(text, offset) {
        var start = this.nodeValue.slice(0, offset);
        var end = this.nodeValue.slice(offset);
        this.nodeValue = start + text + end;
    }
    /**
     * Return a string with the value of a text node stripped of its format space,
     * applying the W3 rules for white space processing
     *
     * @see https://www.w3.org/TR/css-text-3/#white-space-processing
     * @returns {String}
     */
    _removeFormatSpace () {
        var text = this.nodeValue;
        var spaceBeforeNewline = /([ \t])*(\n)/g;
        var spaceAfterNewline = /(\n)([ \t])*/g;
        var tabs = /\t/g;
        var newlines = /\n/g;
        var consecutiveSpace = /  */g;
        text = text.replace(spaceBeforeNewline, '$2')
            .replace(spaceAfterNewline, '$1')
            .replace(tabs, ' ')
            .replace(newlines, ' ')
            .replace(consecutiveSpace, ' ');
        var childOfBlockAncestor = this.ancestor((ancestor) => ancestor.parent && ancestor.parent.isBlock());
        var prev = childOfBlockAncestor && childOfBlockAncestor.previousSibling();
        if (prev && prev.isBlock() || this.isLeftEdgeOfBlock()) {
            var startSpace = /^ */g;
            text = text.replace(startSpace, '');
        }
        childOfBlockAncestor = this.ancestor((ancestor) => ancestor.parent && ancestor.parent.isBlock())
        var next = childOfBlockAncestor && childOfBlockAncestor.nextSibling();
        if (next && next.isBlock() || this.isRightEdgeOfBlock()) {
            var endSpace = / *$/g;
            text = text.replace(endSpace, '');
        }
        return text;
    }
    /**
     * @override
     */
    _removeSide (offset, isLeft) {
        if (!this.isVirtual() && this.length() === 1 && (isLeft && offset === 1 || !isLeft && !offset)) {
            return this._safeRemove();
        }
        var isOnEdge = isLeft && !offset || !isLeft && offset === this.length();
        if (isOnEdge || this.isVirtual()) {
            if (this.isVirtual()) {
                this.params.change(this, offset);
                offset = isLeft ? 0 : 1;
            }
            return this._removeSideOnEdge(isLeft);
        }
        var next = this.split(offset);
        return next && next.removeLeft(isLeft ? 0 : 1);
    }
    /**
     * Remove to the side of the TextNode,
     * when at its edge offset and sibling is a block.
     *
     * @param {ArchNode} nextBlock
     * @param {boolean} isLeft
     * @returns {ArchNode} the node that will be focused after removing
     */
    _removeSideBlock (nextBlock, isLeft) {
        this._triggerChange(isLeft ? 0 : this.length());
        nextBlock = nextBlock.contains(this) ? nextBlock[isLeft ? 'previousSibling' : 'nextSibling']() : nextBlock;
        if (!nextBlock) {
            return this.deleteEdge(isLeft);
        }
        if (nextBlock.isVoid()) {
            return nextBlock.remove();
        }
        if (this.isInList()) {
            // handle edge of between list items of same or different indentations
            // by outdenting the next list item until it's on ground level
            if (nextBlock.isLi()) {
                var liAncestor = this.ancestor('isLi');
                while (nextBlock && nextBlock.isLi() && nextBlock !== liAncestor && nextBlock.outdent) {
                    nextBlock = nextBlock.outdent();
                }
            // handle edge between li > text and same li > p (ie: `<li>a<p>text</p></li>`)
            } else if (this.parent.isLi() && this.commonAncestor(nextBlock).isInList()) {
                this.wrap('p');
            }
        }
        return this.deleteEdge(isLeft);
    }
    /**
     * Remove to the side of the TextNode,
     * when at its edge offset and sibling is a block.
     *
     * @param {boolean} isLeft
     * @returns {ArchNode} the node that will be focused after removing
     */
    _removeSideOnEdge (isLeft) {
        var next = this[isLeft ? 'prev' : 'next']({
            doNotInsertVirtual: true,
            leafToLeaf: true,
            stopAtBlock: true,
        });
        if (!next || next.id === this.id) {
            return;
        }
        var nextLength = next.length();
        if (next.isBR() || next.isVirtual()) {
            return next[isLeft ? 'removeLeft' : 'removeRight'](nextLength ? nextLength - 1 : 0);
        }
        if (next.isBlock()) {
            return this._removeSideBlock(next, isLeft);
        }
        var nextOffset;
        isLeft = !isLeft;
        nextOffset = isLeft ? 1 : nextLength - 1;
        if (nextOffset < 0 || nextOffset > nextLength) {
            nextOffset = 0;
        }
        return next[isLeft ? 'removeLeft' : 'removeRight'](nextOffset);
    }
};

})();
