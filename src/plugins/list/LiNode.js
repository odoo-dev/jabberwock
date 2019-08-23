(function () {
'use strict';

// Custom node representing a list item (li)
class LiNode extends we3.ArchNode {

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Indent this list item
     */
    indent () {
        var indentedList = this.wrap(this.listType);
        indentedList.wrap('li');
    }
    /**
     * Return true if the list is in a checklist or if it is a checklist
     *
     * @returns {boolean}
     */
    isInChecklist () {
        return !!this.ancestor('isChecklist');
    }
    /**
     * Return true if the list item is indented
     *
     * @returns {boolean}
     */
    isIndented () {
        return !!this.ancestor('isParentOfIndented');
    }
    /**
     * @returns {boolean}
     */
    isLi () {
        return true;
    }
    /**
     * Return true if the list item is the parent of an indented list
     *
     * @returns {boolean}
     */
    isParentOfIndented () {
        return this.childNodes.length === 1 && this.firstChild().isList();
    }
    /**
     * Get the list's type (ol, ul, checklist)
     *
     * @returns {string}
     */
    get listType () {
        return this.ancestor('isList').listType;
    }
    /**
     * Indent this list item
     */
    outdent () {
        if (this.isParentOfIndented()) {
            this.descendents(node => node.isLi() && !node.isParentOfIndented(), true).forEach(node => node.outdent());
            return;
        }
        if (this.isIndented()) {
            this.unwrap();
            this.unwrap();
        } else {
            this.unlist();
        }
    }
    unlist () {
        // isolate the li
        this.parent.split(this.index() + 1, true);
        var next = this.parent.split(this.index(), true);
        var prev = this.parent.previousSibling();
        if (prev) {
            prev.removeIfEmpty();
        }
        // remove its list parent, preserving its contents
        next.ancestor('isList').unlist();
    }
    /**
     * @override
     */
    get type () {
        return 'li';
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _applyRulesArchNode () {
        var indentClass = this.params.options.list && this.params.options.list.indentClass;
        if (this.isParentOfIndented() && indentClass) {
            this.className.add(indentClass);
        }
        super._applyRulesArchNode();
    }
    /**
     * @override
     */
    _cleanAfterMerge (isLeft) {
        this._cleanTextVSFormat(isLeft);
    }
    /**
     * In merging two list elements, we might end up with a list element
     * containing format node alongside plain text nodes. This merges them.
     *
     * @private
     * @param {boolean} isLeft true if the merge took place from right to left
     */
    _cleanTextVSFormat (isLeft) {
        var nodes = isLeft ? this.childNodes.reverse() : this.childNodes;
        var hasText = nodes.some(node => node.isText());
        var hasFormat = nodes.some(node => node.isFormatNode());
        if (!hasText || !hasFormat) {
            return;
        }
        var prev;
        nodes.slice().forEach(function (node) {
            if (prev && node.isFormatNode() && prev.isText()) {
                var last = node.lastChild();
                var fragment = new we3.ArchNodeFragment(node.params);
                node.childNodes.slice().forEach(fragment.append.bind(fragment));
                prev.after(fragment);
                node.remove();
                prev = last;
            } else if (prev && node.isText() && prev.isFormatNode()) {
                prev.append(node);
            } else {
                prev = node;
            }
        });
    }
}

we3.LiNode = LiNode;
we3.addArchNode('li', LiNode);

})();
