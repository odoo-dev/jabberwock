(function () {
'use strict';

// Custom node representing a checklist item (default: ul.o_checklist > li)
class ChecklistItemNode extends we3.LiNode {

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    static parse (archNode) {
        if (archNode.isLi() && archNode.isInChecklist && archNode.isInChecklist() &&
            (!archNode.isParentOfIndented || !archNode.isParentOfIndented())) {
            var checklistItem = new ChecklistItemNode(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
            var fragment = archNode._fragmentWithChildren(archNode.childNodes);
            checklistItem.append(fragment);
            return checklistItem;
        }
    }
    /**
     * Check the checklist item and all its lower level checklist items.
     * If all its siblings are checked, also check its higher level checklist item.
     *
     * @see higherLevelChecklistItem
     * @see lowerLevelChecklistItems
     */
    check () {
        this.markAsChecked();
        this._checkHigherIfComplete();
        this._checkLower();
    }
    /**
     * Return the next higher level checklist item, if any,
     * considering this structure:
     * [ ] higher level
     *      [ ] this checklist item
     * which is equivalent to:
     *  <ul>
     *      <li>higher level</li>
     *      <li>
     *          <ul>
     *              <li>this checklist item</li>
     *          </ul>
     *      </li>
     *  </ul>
     *
     * @returns {ArchNode|undefined}
     */
    higherLevelChecklistItem () {
        var parentOfIndented = this.parent.ancestor(node => node.isParentOfIndented && node.isParentOfIndented());
        var higherLevel = parentOfIndented && parentOfIndented.previousSibling();
        if (higherLevel && higherLevel.isChecklistItem && higherLevel.isChecklistItem()) {
            return higherLevel;
        }
    }
    /**
     * Return true if the checklist item is checked
     *
     * @returns {boolean}
     */
    isChecked () {
        if (this._checkedClass) {
            this._isChecked = this.className.contains(this._checkedClass);
        }
        return this._isChecked || false;
    }
    isChecklistItem () {
        return true;
    }
    isInChecklist () {
        return true;
    }
    /**
     * Return true if all of this checklist item's lower level checklist items are checked
     *
     * @see lowerLevelChecklistItems
     * @returns {boolean}
     */
    isLowerLevelComplete () {
        return this.lowerLevelChecklistItems().every(node => node.isChecked());
    }
    /**
     * Return all of this checklist item's direct lower level checklist items,
     * considering this structure:
     * [ ] this checklist item
     *      [ ] direct lower level
     *          [ ] indirect lower level
     * which is equivalent to:
     *  <ul>
     *      <li>this checklist item</li>
     *      <li>
     *          <ul>
     *              <li>direct lower level</li>
     *              <li>
     *                  <ul>
     *                      <li>indirect lower level</li>
     *                  </ul>
     *              </li>
     *          </ul>
     *      </li>
     *  </ul>
     *
     * @returns {ArchNode []}
     */
    lowerLevelChecklistItems () {
        var next = this.nextSibling();
        return next && next.descendents(node => node.isChecklistItem && node.isChecklistItem()) || [];
    }
    /**
     * Mark this checklist item as checked
     */
    markAsChecked () {
        this._isChecked = true;
        if (this._checkedClass && !this.className.contains(this._checkedClass)) {
            this.className.add(this._checkedClass);
        }
    }
    /**
     * Mark this checklist item as unchecked.
     */
    markAsUnchecked () {
        this._isChecked = false;
        if (this._checkedClass && this.className.contains(this._checkedClass)) {
            this.className.remove(this._checkedClass);
        }
    }
    /**
     * Toggle this checklist item's `checked` quality, and update that of its
     * higher and lower levels
     *
     * @see check
     * @see uncheck
     * @see higherLevelChecklistItem
     * @see lowerLevelChecklistItems
     */
    toggleChecked () {
        if (this.isChecked()) {
            this.uncheck();
        } else {
            this.check();
        }
    }
    /**
     * @override
     */
    get type () {
        return 'CHECKLIST_ITEM';
    }
    /**
     * Uncheck the checklist item and all its lower and higher level checklist items.
     *
     * @see higherLevelChecklistItem
     * @see lowerLevelChecklistItems
     */
    uncheck () {
        this.markAsUnchecked();
        this._uncheckHigher();
        this._uncheckLower();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Get the class to apply to checked checklist items from the options, if any
     *
     * @private
     * @returns {string|undefined}
     */
    get _checkedClass () {
        var checklistInfo = this.params.options.list && this.params.options.list.checklist;
        return checklistInfo && checklistInfo.checkedClass;
    }
    /**
     * Check the higher level checklist element if there is one and all its lower level
     * checklist elements are checked.
     *
     * @private
     * @see check
     * @see higherLevelChecklistItem
     */
    _checkHigherIfComplete () {
        var higherLevel = this.higherLevelChecklistItem();
        if (higherLevel && !higherLevel.isChecked() && higherLevel.isLowerLevelComplete()) {
            higherLevel.check();
        }
    }
    /**
     * Check all of this checklist item's lower level checklist items
     *
     * @private
     * @see check
     * @see lowerLevelChecklistItems
     */
    _checkLower () {
        this.lowerLevelChecklistItems().forEach(function (node) {
            if (!node.isChecked()) {
                node.check();
            }
        });
    }
    /**
     * Uncheck this checklist item's higher level checklist items
     *
     * @private
     * @see markAsUnchecked
     * @see higherLevelChecklistItem
     */
    _uncheckHigher () {
        var higherLevel = this.higherLevelChecklistItem();
        while (higherLevel) {
            higherLevel.markAsUnchecked();
            higherLevel = higherLevel.higherLevelChecklistItem();
        }
    }
    /**
     * Uncheck all of this checklist item's lower level checklist items
     *
     * @private
     * @see uncheck
     * @see lowerLevelChecklistItems
     */
    _uncheckLower () {
        this.lowerLevelChecklistItems().forEach(function (node) {
            if (node.isChecked()) {
                node.uncheck();
            }
        });
    }
}

we3.addArchNode('CHECKLIST_ITEM', ChecklistItemNode);

})();
