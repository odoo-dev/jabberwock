(function () {
'use strict';

var tags = we3.tags;
function True () { return true; };
function False () { return false; };

/**
 * Methods to check the node's type
 */
var isType = {
    /**
     * Return true if the node is an anchor element (A, BUTTON, .btn).
     *
     * @returns {Boolean}
     */
    isAnchor: function () {
        return (
                this.nodeName === 'a' ||
                this.nodeName === 'button' ||
                this.className && this.className.contains('btn')
            ) &&
            !this.className.contains('fa') &&
            !this.className.contains('o_image');
    },
    /**
     * Return true if the node is an architectural space node.
     *
     * @returns {Boolean}
     */
    isArchitecturalSpace: False,
    /**
     * Returns true if the node is blank.
     * In this context, a blank node is understood as
     * a node expecting text contents (or with children expecting text contents)
     * but without any.
     * If a predicate function is included, the node is NOT blank if it matches it.
     *
     * @param {Function (Node) => Boolean} [isNotBlank]
     * @returns {Boolean}
     */
    isBlankNode: function (isNotBlank) {
        if (this.isVoid() || isNotBlank && isNotBlank(node)) {
            return false;
        }
        if (this.isBlankText()) {
            return true;
        }
        var isBlankNode = true;
        for (var k = 0; k < this.childNodes.length; k++) {
            if (!this.childNodes[k].isBlankNode(isNotBlank)) {
                isBlankNode = false;
                break;
            }
        }
        return isBlankNode;
    },
    /**
     * Returns true if the node is a text node containing nothing
     *
     * @returns {Boolean}
     */
    isBlankText: False,
    /**
     * Return true if the node is a block.
     *
     * @returns {Boolean}
     */
    isBlock: function () {
        return !this.isInline();
    },
    /**
     * Return true if the node is a block quote element (BLOCKQUOTE).
     *
     * @returns {Boolean}
     */
    isBlockquote: function () {
        return this.nodeName === 'blockquote';
    },
    /**
     * Return true if the node is a line break element (BR).
     *
     * @returns {Boolean}
     */
    isBR: False,
    /**
     * Return true if the node is a table cell element (TD, TH).
     *
     * @returns {Boolean}
     */
    isCell: function () {
        return this.nodeName === 'td' || this.nodeName === 'th';
    },
    /**
     * Return true if the node's text is aligned to the center.
     *
     * @returns {Boolean}
     */
    isCenterAlign: function () {
        var alignedAncestor = this.ancestor(node => node.style && node.style['text-align']);
        var align = alignedAncestor && alignedAncestor.style['text-align'];
        return align && align === 'center';
    },
    isClone: False,
    /**
     * Return true if the node is a data element (DATA).
     *
     * @returns {Boolean}
     */
    isData: function () {
        return this.nodeName === 'data';
    },
    /**
     * Return true if the node's type is element (1).
     *
     * @returns {Boolean}
     */
    isElement: True,
    /**
     * Return true if the node is a flow content.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Flow_content
     * @returns {Boolean}
     */
    isFlowContent: function () {
        if (tags.flowContent.indexOf(this.nodeName) !== -1 || this.isText()) {
            return true;
        }
        var isAreaInMap = this.nodeName === 'area' && this.isInTag('map');
        var isLinkOrMetaWithItemProp = ['link', 'meta'].indexOf(this.nodeName) !== -1 && this.attributes.contains('itemprop');
        var isStyleWithScoped = this.nodeName === 'style' && this.attributes.contains('scoped');
        return isAreaInMap || isLinkOrMetaWithItemProp || isStyleWithScoped;
    },
    /**
     * Return true if the node is a block that can contain text.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Flow_content
     * @returns {Boolean}
     */
    isFlowBlock: function () {
        return this.isBlock() && !this.isVoidoid() && this.isFlowContent();
    },
    isFont: function () {
        return this.nodeName === 'font';
    },
    /**
     * Returns true if the node is a "format" node.
     * In this context, a "format" node is understood as
     * an editable block or an editable element expecting text
     * (eg.: p, h1, span).
     *
     * @returns {Boolean}
     */
    isFormatNode: function () {
        return !this.isVoidoid() && tags.style.concat(tags.format).indexOf(this.nodeName) !== -1;
    },
    isFragment: False,
    /**
     * Return true if the node is a horizontal rule element (HR).
     *
     * @returns {Boolean}
     */
    isHr: function () {
        return this.nodeName === 'hr';
    },
    /**
     * Return true if the node is an inline element.
     *
     * @returns {Boolean}
     */
    isInline: function () {
        return tags.inline.concat('font').indexOf(this.nodeName) !== -1;
         // &&
         //    !this.isCell() &&
         //    !this.isEditable() &&
         //    !this.isList() &&
         //    !this.isPre() &&
         //    !this._isHr() &&
         //    !this._isPara() &&
         //    !this._isTable() &&
         //    !this._isBlockquote() &&
         //    !this.isData();
    },
    /**
     * Return true if the node is an format node that is inline.
     *
     * @returns {Boolean}
     */
    isInlineFormatNode: function () {
        return !this.isVoidoid() && tags.format.indexOf(this.nodeName) !== -1;
    },
    /**
     * Return true if the node is a break element (BR) that won't show visually.
     *
     * @returns {Boolean}
     */
    isInvisibleBR: False,
    /**
     * Return true if the node's text's alignment is justified.
     *
     * @returns {Boolean}
     */
    isJustifyAlign: function () {
        var alignedAncestor = this.ancestor(node => node.style && node.style['text-align']);
        var align = alignedAncestor && alignedAncestor.style['text-align'];
        return align && align === 'justify';
    },
    /**
     * Return true if the node's text is aligned to the left. Default: true.
     *
     * @returns {Boolean}
     */
    isLeftAlign: function () {
        var align = this.style && this.style['text-align'];
        if (!align || align !== 'left') {
            var alignedAncestor = this.ancestor(node => node.style && node.style['text-align']);
            if (alignedAncestor && alignedAncestor.style['text-align'] !== 'left') {
                return false;
            }
        }
        return true;
    },
    /**
     * Return true if the node is a list item element (LI).
     *
     * @returns {Boolean}
     */
    isLi: function () {
        return this.nodeName === 'li';
    },
    /**
     * Return true if the node is a (un-)ordered list element (UL, OL).
     *
     * @returns {Boolean}
     */
    isList: function () {
        return ['ul', 'ol'].indexOf(this.nodeName) !== -1;
    },
    /**
     * Returns true if the node is a block.
     *
     * @todo
     * @returns {Boolean}
     */
    isNodeBlockType: function () {
        console.warn('todo');
        return false;
        var display = window.getComputedStyle(node).display;
        // All inline elements have the word 'inline' in their display value, except 'contents'
        return display.indexOf('inline') === -1 && display !== 'contents';
    },
    /**
     * Return true if the node is a paragraph element (DIV, P, LI, H[1-7]).
     *
     * @returns {Boolean}
     */
    isPara: function () {
        // Chrome(v31.0), FF(v25.0.1) use DIV for paragraph
        return tags.style.concat(['div']).indexOf(this.nodeName) !== -1;
    },
    /**
     * Return true if the node is a BR that serves as a placeholder in a block for technical purposes.
     *
     * @returns {Boolean}
     */
    isPlaceholderBR: False,
    /**
     * Return true if the node is a preformatted text element (PRE).
     *
     * @returns {Boolean}
     */
    isPre: function () {
        return this.nodeName === 'pre';
    },
    /**
     * Return true if the node is removed from this arch
     *
     * @returns {Boolean}
     */
    isRemoved: function () {
        return this.__removed;
    },
    /**
     * Return true if the node's text is aligned to the right.
     *
     * @returns {Boolean}
     */
    isRightAlign: function () {
        var alignedAncestor = this.ancestor(node => node.style && node.style['text-align']);
        var align = alignedAncestor && alignedAncestor.style['text-align'];
        return align && align === 'right';
    },
    /**
     * Return true if the current node is the root node.
     *
     * @returns {Boolean}
     */
    isRoot: False,
    /**
     * Return true if the node is a span element (SPAN).
     *
     * @returns {Boolean}
     */
    isSpan: function () {
        return this.nodeName === 'span';
    },
    /**
     * Return true if the node is a table element (TABLE).
     *
     * @returns {Boolean}
     */
    isTable: function () {
        return this.nodeName === 'table';
    },
    /**
     * Return true if the node's type is text (3).
     *
     * @returns {Boolean}
     */
    isText: False,
    /**
     * Return true if the node is a text area element (TEXTAREA).
     *
     * @returns {Boolean}
     */
    isTextarea: function () {
        return this.nodeName === 'textarea';
    },
    /**
     * Return true if the node is a table data cell element (TD).
     *
     * @returns {Boolean}
     */
    isTd: function () {
        return this.nodeName === 'td';
    },
    /**
     * Return true.
     *
     * @returns {Boolean}
     */
    isTrue: True,
    /**
     * Return true if the node is virtual (technical node).
     *
     * @see ArchNodeVirtualText
     * @returns {Boolean}
     */
    isVirtual: False,
    /**
     * Return true if the BR is visible (it visibly shows a newline).
     *
     * @returns {Boolean}
     */
    isVisibleBR: False,
    /**
     * Returns true if the node is a text node with visible text.
     *
     * @returns {Boolean}
     */
    isVisibleText: False,
    /**
     * Return true if the node is a void element (BR, COL, EMBED, HR, IMG, INPUT, ...).
     *
     * @see http://w3c.github.io/html/syntax.html#void-elements
     * @returns {Boolean}
     */
    isVoid: function () {
        return tags.void.indexOf(this.nodeName) !== -1;
    },
    /**
     * Return true if the node should behave like a void element (eg: pictogram).
     *
     * @returns {Boolean}
     */
    isVoidoid: function () {
        return this.isVoid() || this.params.isVoidoid(this);
    },
};
Object.assign(we3.ArchNode.prototype, isType);

/**
 * Methods to check the node's ancestors' types
 */
var isInType = {
    /**
     * Return true if the node is present in the Arch.
     *
     * @returns {Boolean}
     */
    isInArch: function () {
        return this.isRoot() || !!this.parent && !!this.id && !this.__removed;
    },
    /**
     * Return true if the node is contained within a node of given tag name.
     *
     * @param {Boolean} tag eg: 'B', 'I', 'U'
     * @returns {Boolean}
     */
    isInTag: function (tag) {
        return !!this.ancestor(function (n) {
            return n.nodeName === tag;
        });
    },
};
Object.keys(isType).forEach(function (type) {
    isInType['isIn' + type.slice(2)] = function () {
        return !!this.ancestor(type);
    };
});
Object.assign(we3.ArchNode.prototype, isInType);

/**
 * Methods to test the node in relationship with its surroundings.
 */
var isBrowse = {
    /**
     * Return true if the node has a BR element as previous sibling.
     *
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isAfterBR: function (ignoreVirtual) {
        var pred = node => !ignoreVirtual || !node.isVirtual();
        var previousSibling = this.previousSibling(pred);
        return previousSibling && previousSibling.isBR();
    },
    /**
     * Return true if the node has no visible content.
     *
     * @returns {Boolean}
     */
    isDeepEmpty: function () {
        if (!this.childNodes || !this.childNodes.length) {
            return this.isEmpty() || this.isPlaceholderBR();
        }
        return this.childNodes.every(function (child) {
            var isNotBlockBlock = !child.isBlock() || child.parent.isList() || child.parent.isLi();
            return isNotBlockBlock && (!child.isVisibleBR() || child.isPlaceholderBR()) && child.isDeepEmpty();
        });
    },
    /**
     * Return true if `node` is a descendent of `ancestor` (or is `ancestor` itself).
     *
     * @param {ArchNode} ancestor
     * @returns {Boolean}
     */
    isDescendentOf: function (ancestor) {
        var node = this;
        while (node) {
            if (node.id === ancestor.id) {
                return true;
            }
            node = node.parent;
        }
        return false;
    },
    /**
     * Return true if the node is empty.
     *
     * @param {Boolean} keepVirtual true not to consider virtual nodes as blank
     * @returns {Boolean}
     */
    isEmpty: function (keepVirtual) {
        if (this.isVoidoid()) {
            return false;
        }
        if (this.childNodes.length === 0) {
            return true;
        }
        var child = this.childNodes[0];
        if (this.childNodes.length === 1) {
            if (child.isBR() || !keepVirtual && child.isText() && child.isEmpty()) {
                return true;
            }
        }
        if (this.isFilledWithOnlyBlank()) {
            return !keepVirtual || this.childNodes.every((child) => !child.isVirtual());
        }
        return false;
    },
    /**
     * Return true if all the node's children are blank (virtual, architectural, blank text).
     *
     * @returns {Boolean}
     */
    isFilledWithOnlyBlank: function () {
        return this.childNodes.every(function (child) {
            return child.isVirtual() || child.isArchitecturalSpace() || child.isBlankText();
        });
    },
    /**
     * Return true if the node is indented.
     *
     * @returns {Boolean}
     */
    isIndented: function () {
        var margin = this.style && this.style['margin-left'];
        if (!margin) {
            return false;
        }
        margin = margin.slice(0, margin.length - 2); // remove the 'em'
        return parseFloat(margin) > 0;
    },
    /**
     * Return true if the node is on a left edge (ignoring invisible text).
     *
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isLeftEdge: function (ignoreVirtual) {
        if (!this.parent) {
            return false;
        }
        var previousSibling = this.parent.childNodes.slice(0, this.index());
        while (previousSibling.length && 
            (previousSibling[0].isArchitecturalSpace() ||
                ignoreVirtual && previousSibling[0].isVirtual())) {
            previousSibling.shift();
        }
        return !previousSibling.length;
    },
    /**
     * Return true if the node is the left-most node of given ancestor.
     *
     * @param {Node} ancestor
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isLeftEdgeOf: function (ancestor, ignoreVirtual) {
        return this.isLeftEdgeOfPred(node => node === ancestor, ignoreVirtual);
    },
    /**
     * Return true if the node is the left-most node of a block.
     *
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isLeftEdgeOfBlock: function (ignoreVirtual) {
        return this.isLeftEdgeOfPred(node => node.isBlock(), ignoreVirtual);
    },
    /**
     * Return true if the node is the left-most node of a node matching the predicate function.
     *
     * @param {Function} pred
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isLeftEdgeOfPred: function (pred, ignoreVirtual) {
        var node = this;
        while (node && !pred(node)) {
            if (!node.isLeftEdge(ignoreVirtual)) {
                return false;
            }
            node = node.parent;
        }
        return true;
    },
    /**
     * Return true if the node is a list item containing an indented list.
     *
     * @returns {Boolean}
     */
    isParentOfIndentedList: function () {
        return this.isLi() && this.firstChild() && this.firstChild().isList();
    },
    /**
     * Return true if the node is on a right edge (ignoring invisible text).
     *
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isRightEdge: function (ignoreVirtual) {
        if (!this.parent) {
            return false;
        }
        var nextSibling = this.parent.childNodes.slice(this.index() + 1);
        while (nextSibling.length &&
            (nextSibling[0].isArchitecturalSpace() ||
                ignoreVirtual && nextSibling[0].isVirtual())) {
            nextSibling.shift();
        }
        return !nextSibling.length;
    },
    /**
     * Return true if the node is the right-most node of given ancestor.
     *
     * @param {Node} ancestor
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isRightEdgeOf: function (ancestor, ignoreVirtual) {
        return this.isRightEdgeOfPred(node => node === ancestor, ignoreVirtual);
    },
    /**
     * Return true if the node is the right-most node of a block.
     *
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isRightEdgeOfBlock: function (ignoreVirtual) {
        return this.isRightEdgeOfPred(node => node.isBlock(), ignoreVirtual);
    },
    /**
     * Return true if the node is the right-most node of a node matching the predicate function.
     *
     * @param {Function} pred
     * @param {Boolean} [ignoreVirtual] true to ignore virtual text nodes
     * @returns {Boolean}
     */
    isRightEdgeOfPred: function (pred, ignoreVirtual) {
        var node = this;
        while (node && !pred(node)) {
            if (!node.isRightEdge(ignoreVirtual)) {
                return false;
            }
            node = node.parent;
        }
        return true;
    },
};
Object.assign(we3.ArchNode.prototype, isBrowse);

/**
 * Methods to check the node's editability and breakability
 */
var isEditable = {
    /**
     * Return true if updating this node is allowed.
     *
     * @returns {Boolean}
     */
    isAllowUpdate: function () {
        return this.params.isBypassUpdateConstraintsActive() || !this.isInArch() || this.isEditable();
    },
    /**
     * Return true if the node is a contentEditable container.
     *
     * @returns {Boolean}
     */
    isContentEditable: function () {
        return this.params.isEditableNode(this);
    },
    /**
     * Return true if the node is editable.
     *
     * @returns {Boolean}
     */
    isEditable: function () {
        if (!this.parent) { // the node is out of the Arch
            return true;
        }
        var isContentEditable = this.isContentEditable();
        if (isContentEditable) {
            return true;
        } else if (isContentEditable === false) {
            return false;
        }
        return this.parent.isEditable();
    },
    /**
     * Return true if the node is unbreakable.
     *
     * @returns {Boolean}
     */
    isUnbreakable: function () {
        return !this.parent ||
            this.isRoot() ||
            this.isFragment() ||
            this.isInArch() && (["td", "tr", "tbody", "tfoot", "thead", "table"].indexOf(this.nodeName) !== -1 ||
            this.isVoidoid() && !this.isVoid() ||
            this.isContentEditable() ||
            this.params.isUnbreakableNode(this) ||
            !this.isAllowUpdate() ||
            !this.parent.isAllowUpdate());
    },
}
Object.assign(we3.ArchNode.prototype, isEditable);

/**
 * Methods to check the opposite of every method above.
 */
var isNotType = {};
Object.keys(we3.ArchNode.prototype).forEach(function (type) {
    isNotType['isNot' + type.slice(2)] = function () {
        return !this[type].apply(this, arguments);
    };
});
Object.assign(we3.ArchNode.prototype, isNotType);

})();
