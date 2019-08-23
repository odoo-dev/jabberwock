(function () {
'use strict';

// Plugin to handle lists
var ListPlugin = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Indent', 'Range'];
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_list.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.list',
            active: '_active',
        };
        this.editableDomEvents = {
            'mousedown': '_onMouseDown',
            'keydown': '_onKeyDown',
        };
        this.options.list = this.options.list || {
            checklist: {
                className: 'o_checklist',
                checkedClass: 'o_checked',
            },
            indentClass: 'o_indent',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Indent the list
     */
    indent () {
        var self = this;
        var range = this.dependencies.Range.getRange();
        this.dependencies.Arch.do(function () {
            self.dependencies.Arch.indent();
            return range;
        });
    }
    /**
     * Outdent the list
     */
    outdent () {
        var self = this;
        var range = this.dependencies.Range.getRange();
        this.dependencies.Arch.do(function () {
            self.dependencies.Arch.outdent();
            return range;
        });
    }
    /**
     * Insert an ordered list, an unordered list or a checklist.
     * If already in list, remove the list or convert it to the given type.
     *
     * @param {string('ol'|'ul'|'checklist')} type the type of list to insert
     */
    toggle (type) {
        this.dependencies.Arch.do(getArchNode => this._toggle(type, getArchNode));
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {String} buttonName
     * @param {ArchNode} focusNode
     * @returns {Boolean} true if the given button should be active
     */
    _active (buttonName, focusNode) {
        if (!focusNode.isInList()) {
            return false;
        }
        var listType = buttonName.split('-')[1];
        var method = 'is' + listType.slice(0,1).toUpperCase() + listType.slice(1);
        return !!focusNode.ancestor(node => node[method] && node[method]());
    }
    /**
     * Convert ul<->ol, ul<->checklist, ol<->checklist.
     *
     * @private
     * @param {string('ol'|'ul'|'checklist')} type the type of list to insert
     * @param {function} getArchNode
     * @returns {ArchNode []} list of created lists
     */
    _convertList (type, getArchNode) {
        var idsToWrap = this._removeList(getArchNode);
        return this._insertList(type, getArchNode, idsToWrap);
    }
    /**
     * Insert a list at range or turn `nodeToWrap` into a list.
     *
     * @private
     * @param {string('ol'|'ul'|'checklist')} nodeName the type of list to insert
     * @param {function} getArchNode
     * @param {ArchNode|number []} [nodesToWrap] the node to wrap or its id
     * @returns {ArchNode []} list of created lists
     */
    _insertList (nodeName, getArchNode, nodesToWrap) {
        var idsToWrap = (nodesToWrap || []).map(function (nodeOrID) {
            return typeof nodeOrID === 'number' ? nodeOrID : nodeOrID.id;
        });
        var liIDs = [];
        // wrap each lowest level block at range into a li
        if (idsToWrap.length) {
            liIDs = this.dependencies.Arch.wrap(idsToWrap, 'li');
        } else {
            /* `wrapAncestorPred` ensures we wrap either the block parent or the
            child of a `td` */
            liIDs = this.dependencies.Arch.wrapRange('li', {
                doNotSplit: true,
                wrapAncestorPred: n => n.parent && n.parent.isTd() || n.isBlock(),
            });
        }
        // wrap the generated list items into a list of type `nodeName`
        return this.dependencies.Arch.wrap(liIDs, nodeName)
            .map(getArchNode).filter(node => node && node.isList());
    }
    /**
     * Return true if every node in the given array is in a list.
     * Note: return false if the array is empty.
     *
     * @private
     * @param {ArchNode []} nodes
     * @returns {boolean}
     */
    _isAllInList (nodes) {
        return !!nodes.length && nodes.every(node => node.isInList());
    }
    /**
     * Return true if every node in the given array is in a list of type `type`.
     * Note: return false if the array is empty.
     *
     * @private
     * @param {ArchNode []} nodes
     * @param {string} type
     * @returns {boolean}
     */
    _isAllInListType (nodes, type) {
        if (!this._isAllInList(nodes)) {
            return false;
        }
        var method;
        if (type === 'ul') {
            method = node => node.isUl && node.isUl() && (!node.isChecklist || !node.isChecklist());
        } else {
            var methodName = 'is' + type.slice(0,1).toUpperCase() + type.slice(1);
            method = node => node[methodName] && node[methodName]();
        }
        var firstListAncestors = nodes.map(node => node.ancestor('isList'));
        return !!firstListAncestors.length && firstListAncestors.every(method);
    }
    /**
     * Merge a list with its next and previous list if any,
     * and return a list of the remaining edges
     *
     * @private
     * @param {ArchNode} list
     */
    _mergeSiblingLists (list) {
        function __mergeNextList (list, isPrev) {
            var nextList = list[isPrev ? 'previousSibling' : 'nextSibling']();
            if (nextList && nextList.listType === list.listType) {
                var nextEdge = isPrev ? list : nextList;
                nextEdge.deleteEdge(true, { mergeOnlyIfSameType: true });
            }
        }
        __mergeNextList(list, false);
        __mergeNextList(list, true);
        var parentOfIndented = list.ancestor('isParentOfIndented');
        if (parentOfIndented) {
            parentOfIndented.deleteEdge(false, { mergeOnlyIfSameType: true });
        }
    }
    /**
     * Remove a list at range
     *
     * @private
     * @param {function} getArchNode
     * @returns {number []} the ids of the unwrapped contents
     */
    _removeList (getArchNode) {
        var nodeNamesToRemove = ['li', 'ol', 'ul'];
        var liAncestors = this._selectedListItems().map(getArchNode);
        var contentIDs = we3.utils.flatMap(liAncestors, li => li.childNodes)
            .map(node => node.id);
        if (liAncestors.length && liAncestors.every(li => li.isIndented())) {
            this.dependencies.Arch.outdent();
        } else if (this.dependencies.Range.isCollapsed()) {
            if (!contentIDs.length) { // li has no children => append a virtual
                var virtual = liAncestors[0].params.create();
                liAncestors[0].append(virtual);
                contentIDs.push(virtual.id);
            }
            this.dependencies.Arch.unwrapFrom(contentIDs, nodeNamesToRemove);
        } else {
            this.dependencies.Arch.unwrapRangeFrom(nodeNamesToRemove, {
                doNotSplit: true,
            });
        }
        return contentIDs;
    }
    /**
     * Return a list of ids of list items (`li`) at range
     *
     * @private
     * @returns {number []}
     */
    _selectedListItems () {
        var selectedLeaves = this.dependencies.Range.getSelectedLeaves();
        return selectedLeaves.map(function (node) {
            var liAncestor = node.ancestor('isLi');
            return liAncestor && liAncestor.id;
        }).filter(id => id);
    }
    /**
     * Return a list of lists (`ul`, `ol`, `checklist`) at range
     *
     * @private
     * @returns {ArchNode []}
     */
    _selectedLists () {
        var selectedLeaves = this.dependencies.Range.getSelectedLeaves();
        var listAncestors = selectedLeaves.map(node => node.ancestor('isList'));
        return we3.utils.uniq(listAncestors.filter(node => node));
    }
    /**
     * Insert an ordered list, an unordered list or a checklist.
     * If already in list, remove the list or convert it to the given type.
     *
     * @private
     * @param {string('ol'|'ul'|'checklist')} type the type of list to insert
     * @param {function} getArchNode
     */
    _toggle (type, getArchNode) {
        var range = this.dependencies.Range.getRange();
        var selectedLeaves = this.dependencies.Range.getSelectedLeaves();
        var newLists = [];
        if (this._isAllInList(selectedLeaves)) {
            if (this._isAllInListType(selectedLeaves, type)) {
                this._removeList(getArchNode); // [ REMOVE ]
            } else {
                newLists = this._convertList(type, getArchNode); // [ CONVERT ]
            }
        } else {
            newLists = this._insertList(type, getArchNode); // [ INSERT ]
        }
        newLists.slice().forEach(this._mergeSiblingLists); // Clean edges
        var start = getArchNode(selectedLeaves[0].id); // Restore range
        var end = getArchNode(selectedLeaves[selectedLeaves.length - 1].id);
        if (start && end) {
            return {
                scID: start.id,
                so: range.so,
                ecID: end.id,
                eo: range.eo,
            };
        }
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    /**
     * Handle special list behavior of `BACKSPACE` and `TAB` key presses
     *
     * @private
     * @param {KeyboardEvent} e
     */
    _onKeyDown (e) {
        if (e.defaultPrevented) {
            return;
        }
        var range = this.dependencies.Range.getRange();
        if (!range.scArch.isInLi() || !range.ecArch.isInLi()) {
            return;
        }
        var isLeftEdgeOfLi = range.scArch.isLeftEdgeOfPred(node => node.isLi()) && range.so === 0;
        switch (e.key) {
            case 'Backspace':
                if (range.isCollapsed() && isLeftEdgeOfLi) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.outdent();
                }
                break;
            case 'Tab':
                if (this.options.tab && !this.options.tab.enabled) {
                    return;
                }
                if (e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.outdent();
                } else if (!range.isCollapsed() || isLeftEdgeOfLi) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.indent();
                }
                break;
        }
    }
    /**
     * Handle the clicking of a checklist item
     *
     * @private
     * @param {MouseEvent} e
     */
    _onMouseDown (e) {
        var archNode = this.dependencies.Arch.getClonedArchNode(e.target);
        var isChecklistItem = archNode && archNode.isChecklistItem && archNode.isChecklistItem();
        var isClickInCheckbox = isChecklistItem && e.offsetX <= 0;
        if (!isClickInCheckbox) {
            return;
        }
        e.preventDefault();
        archNode.toggleChecked();
        var highestChecklist = archNode.ancestor(node => node.isChecklist && node.isChecklist(), true);
        this.dependencies.Arch.importUpdate(highestChecklist.toJSON());
        this.dependencies.Range.setRange({
            scID: archNode.id,
            so: 0,
        });
    }
};

we3.addPlugin('List', ListPlugin);

})();
