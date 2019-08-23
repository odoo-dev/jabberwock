(function () {
'use strict';

// Custom node representing a list (ul, ol, checklist)
class ListNode extends we3.ArchNode {
    /**
     * @override
     */
    static parse (archNode) {
        if (!archNode.isChecklist && (archNode.nodeName === 'ul' || archNode.nodeName === 'ol')) {
            var list = new ListNode(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
            var fragment = archNode._fragmentWithChildren(archNode.childNodes);
            list.append(fragment);
            return list;
        }
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
     * Return true if the list is indented
     *
     * @returns {boolean}
     */
    isIndented () {
        return !!this.ancestor('isLi');
    }
    /**
     * @returns {boolean}
     */
    isList () {
        return true;
    }
    /**
     * Return true if the list is ordered
     *
     * @returns {boolean}
     */
    isOl () {
        return this.nodeName === 'ol';
    }
    /**
     * Return true if the list is unordered (note: checklists are undordered)
     *
     * @returns {boolean}
     */
    isUl () {
        return this.nodeName === 'ul';
    }
    /**
     * Return a list of list items (`li`) inside this list.
     * By default, return only the first level list item children.
     *
     * @param {boolean} [all] true to include contained indented lists
     * @returns {ArchNode []}
     */
    items (all) {
        return this.descendents(node => node.isLi(), all);
    }
    /**
     * Get the list's type (ol, ul, checklist)
     *
     * @returns {string}
     */
    get listType () {
        return this.nodeName;
    }
    /**
     * @override
     */
    get type () {
        return 'LIST';
    }
    /**
     * Remove the list, preserving its contents, unlisted.
     * If the list is preceded by another list, move the contents to
     * the previous list item and return that list item.
     * 
     * @returns {ArchNode|undefined}
     */
    unlist () {
        var beforeList = this.previousSibling();
        if (beforeList && beforeList.isList()) {
            return this._mergeContentsWithPreviousLi();
        }
        return this._unlist();
    }

    /**
     * After moving the contents of a list to another list,
     * call this to clean the new edges.
     *
     * @private
     * @param {ArchNode []} contents
     */
    _cleanEdgesAfterUnlistMerge (contents) {
        // merge two p's in a li, not two li's
        if (contents.length && !(contents[0].isText() && contents[0].parent.isLi())) {
            contents[0].deleteEdge(true, { doNotRemoveEmpty: true });
        }
        var prev = this.previousSibling();
        this.remove();
        if (prev) {
            prev.deleteEdge(false, { doNotRemoveEmpty: true });
        }
    }
    /**
     * Moving the contents of a list to its preceding list
     *
     * @private
     * @returns {ArchNode}
     */
    _mergeContentsWithPreviousLi () {
        var beforeList = this.previousSibling();
        var li = this.items()[0];
        var contents = li.childNodes.slice();

        /* do not move a trailing BR to the previous node
        or move nodes after a trailing BR */
        this._removeTrailingBR(beforeList);
        this._removeTrailingBR(contents);

        var previousLi = beforeList.items(true).pop();
        contents.slice().forEach(node => previousLi.append(node));
        previousLi._cleanTextVSFormat(false);
        this._cleanEdgesAfterUnlistMerge(contents);

        return previousLi;
    }
    /**
     * Remove the `node`'s last leaf (or the last element
     * in the  `node` array) it it's a `BR`.
     *
     * @private
     * @param {ArchNode|ArchNode []} node
     */
    _removeTrailingBR (node) {
        if (Array.isArray(node)) {
            if (node[node.length - 1].isBR()) {
                node.pop();
            }
        } else {
            var lastLeaf = node.lastLeaf();
            if (lastLeaf.isBR()) {
                lastLeaf.remove();
            }
        }
    }
    /**
     * Move the contents of the list out of the list and remove the list.
     *
     * @private
     */
    _unlist () {
        var self = this;
        var li = this.items()[0];
        var contents = li.childNodes.slice();
        /* if there is nothing before the list or it's not another list,
        just insert the new content before the list */
        contents.slice().forEach(node => self.before(node));
        this.remove();
    }
}

we3.ListNode = ListNode;
we3.addArchNode('List', ListNode);

})();
