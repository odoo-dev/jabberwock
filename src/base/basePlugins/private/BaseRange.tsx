(function () {
'use strict';

/*
What are the key problem that BaseRange is trying to solve?
*/

var WrappedRange = we3.WrappedRange;

var BaseRange = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Renderer', 'BaseArch', 'BaseRenderer'];
        this.editableDomEvents = {
            'mouseup': '_onMouseUpEditable',
            'click': '_onClick',
            'keydown': '_onKeydown',
            'keyup': '_onKeyup',
        };
        this.documentDomEvents = {
            'mousedown': '_onMouseDown',
            'touchstart': '_onMouseDown',
            'mouseup': '_onMouseUp',
            'touchend': '_onMouseUp',
        };
    }
    willStart () {
        this._focusedNodeID = 1;
        this._range = {
            scID: 1,
            so: 0,
            ecID: 1,
            eo: 0,
        };
        return super.willStart();
    }
    blurEditor () {
        this._editorFocused = false;
    }
    focusEditor () {
        this._editorFocused = true;
        this.setRange({
            scID: this._range.scID || 1,
            so: this._range.so || 0,
            ecID: this._range.ecID || 1,
            eo: this._range.eo || 0,
        });
    }
    setEditorValue () {
        this._reset();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get the currently focused node.
     *
     * @returns {ArchNode}
     */
    getFocusedNode () {
        return this.dependencies.BaseArch.getClonedArchNode(this._focusedNodeID) || this.dependencies.BaseArch.getClonedArchNode(1);
    }
    /**
     * Get the current range.
     *
     * @returns {WrappedRange}
     */
    getRange () {
        var Renderer = this.dependencies.Renderer;
        var Arch = this.dependencies.Arch;
        var sc = Renderer.getElement(this._range.scID);
        var ec = this._range.scID === this._range.ecID ? sc : Renderer.getElement(this._range.ecID);
        if (!Arch.getClonedArchNode(this._range.scID)) {
            console.warn('The range is corrupt');
        }
        return new WrappedRange(Arch, Renderer, {
            sc: sc,
            scArch: Arch.getClonedArchNode(this._range.scID),
            scID: this._range.scID,
            so: this._range.so,
            ec: ec,
            ecArch: Arch.getClonedArchNode(this._range.ecID),
            ecID: this._range.ecID,
            eo: this._range.eo,
        });
    }
    /**
     * Returns a list of all selected leaves in the range.
     *
     * @returns {ArchNode []}
     */
    getSelectedLeaves () {
        return this.getSelectedNodes(node => !node.childNodes || !node.childNodes.length);
    }
    /**
     * Returns a list of all selected nodes in the range.
     * If a predicate function is included, only nodes meeting its
     * conditions will be returned.
     *
     * @param {function} [pred]
     * @returns {ArchNode []}
     */
    getSelectedNodes (pred) {
        var range = this.getRange();
        var start = range.scArch.firstLeaf();
        var end = range.ecArch.lastLeaf();
        if (range.scID !== range.ecID && range.so === range.scArch.length()) {
            start = range.scArch.nextSibling() || range.scArch;
        }
        if (range.scID !== range.ecID && range.eo === 0) {
            end = range.scArch.previousSibling() || range.ecArch;
        }
        var selection = [];
        if (!pred || pred.call(start, start)) {
            selection.push(start);
        }
        if (range.scID !== range.ecID) {
            start.nextUntil(function (next) {
                if (!pred || pred.call(next, next)) {
                    selection.push(next);
                }
                return next === end;
            });
        }
        return selection;
    }
    /**
     * Get the range from the selection in the DOM.
     *
     * @private
     * @returns {WrappedRange}
     */
    getRangeFromDOM () {
        return new WrappedRange(this.dependencies.Arch, this.dependencies.Renderer, {});
    }
    /**
     * Return true if the start range is the same point as the end range.
     *
     * @returns {Boolean}
     */
    isCollapsed () {
        return this.getRange().isCollapsed();
    }
    /**
     * Return range points from the from `startID` to `endID`.
     *
     * @param {ArchNode|number} start the ArchNode or its ID
     * @param {ArchNode|number} end the ArchNode or its ID
     * @returns {object} {scID: {Number}, so: {Number}, ecID: {Number}, eo: {Number}}
     */
    rangeOn (start, end) {
        var scArch = typeof start === 'number' ? this.dependencies.Arch.getClonedArchNode(start) : start;
        var ecArch = typeof end === 'number' ? this.dependencies.Arch.getClonedArchNode(end) : end;
        return {
            scID: scArch.id,
            so: scArch.isVirtual() ? 1 : 0, // if virtual, move after it
            ecID: ecArch.id,
            eo: ecArch.isVirtual() ? 1 : ecArch.length(), // if virtual, move after it
        };
    }
    /**
     * Restore the range to its last saved value.
     *
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    restore () {
        return this._setRange(this.getRangeFromDOM());
    }
    /**
     * Select all the contents of the previous start container's first
     * unbreakable ancestor
     */
    selectAll () {
        var scArch = this.dependencies.BaseArch.getArchNode(this._range.scID);
        this.setRange({
            scID: scArch.ancestor('isUnbreakable').id,
        });
    }
    /**
     * Set the range and apply it.
     * Pass only `points.scID` to set the range on the whole element.
     * Pass only `points.scID` and `points.so` to collapse the range on the start.
     *
     * @param {Object} points
     * @param {Node} points.scID start arch node id
     * @param {Number} [points.so] start offset
     * @param {Node} [points.ecID] end arch node id
     * @param {Number} [points.eo] must be given if ecID is given
     * @param {Boolean} [points.ltr] true if the selection was made from left to right (from sc to ec)
     * @param {Object} [options]
     * @param {Boolean} [options.moveLeft] true if a movement is initiated from right to left
     * @param {Boolean} [options.moveRight] true if a movement is initiated from left to right
     * @param {Boolean} [options.muteTrigger]
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    setRange (points, options) {
        this._computeSetRange(points, options);
        return this._setRange(this.getRangeFromDOM(), options);
    }
    /**
     * Return a deep copy of the range values.
     *
     * @returns {Object}
     */
    toJSON () {
        return Object.assign({}, this._range);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Compute and set the range.
     * Pass only `startPoints.scID` to set the range on the whole element.
     * Pass only `startPoints.scID` and `startPoints.so` to collapse the range on the start.
     *
     * @private
     * @param {Object} startPoints
     * @param {Node} startPoints.scID
     * @param {Number} [startPoints.so]
     * @param {Node} [startPoints.ecID]
     * @param {Number} [startPoints.eo] must be given if ecID is given
     * @param {Boolean} [startPoints.ltr] true if the selection was made from left to right (from sc to ec)
     * @param {Object} [options]
     * @param {Boolean} [options.moveLeft] true if a movement is initiated from right to left
     * @param {Boolean} [options.moveRight] true if a movement is initiated from left to right
     */
    _computeSetRange (startPoints, options) {
        var ltr = typeof startPoints.ltr === 'undefined' ? true : startPoints.ltr;
        options = options || {};
        var points = this._deducePoints(startPoints);
        if (options.moveLeft || options.moveRight) {
            points = this._jumpOverVirtualText(points, options);
        }
        points = this._moveToDeepest(points);
        points = this._moveOutOfNotEditable(points);
        points = this._moveOutOfUnbreakable(points, ltr);
        points = this._moveToDeepest(points);
        points = this._moveUpToVoidoid(points);
        points = this._moveToEndOfInline(points);
        points = this._moveToBeforeInline(points);
        points = this._moveToEdgeOfBRSequence(points);

        this._didRangeChange = this._willRangeChange(points) || this._didRangeChange;
        var focusedNodeID = this._getFutureFocusNode(points);
        var focusedNode = this.dependencies.BaseArch.getArchNode(focusedNodeID);
        if ((options.moveLeft || options.moveRight) && focusedNode.isVoidoid()) {
            points = this._moveToSideOfVoidoid(points, !!options.moveLeft);
            focusedNodeID = points.scID;
        }

        if (this._focusedNodeID !== focusedNodeID) {
            this._didChangeFocusNode = true;
            this._focusedNodeID = focusedNodeID;
        }

        this._range.scID = points.scID;
        this._range.so = points.so;
        this._range.ecID = points.ecID;
        this._range.eo = points.eo;
    }
    /**
     * Deduce the intended ids and offsets from the given ids and offsets.
     * Pass only `points.scID` to get the whole element.
     * Pass only `points.scID` and `points.so` to collapse on the start node.
     *
     * @private
     * @param {Object} pointsWithIDs
     * @param {Number} pointsWithIDs.scID
     * @param {Number} [pointsWithIDs.so]
     * @param {Number} [pointsWithIDs.ecID]
     * @param {Number} [pointsWithIDs.eo]
     * @returns {Object}
     */
    _deducePoints (pointsWithIDs) {
        if (!pointsWithIDs.sc && !pointsWithIDs.scID) {
            return this._deducePoints({
                scID: 1,
                so: 1,
            });
        }
        var scID = pointsWithIDs.scID;
        var so = pointsWithIDs.so || 0;
        var ecID = pointsWithIDs.ecID || scID;
        var eo = pointsWithIDs.eo;
        if (!pointsWithIDs.ecID) {
            eo = typeof pointsWithIDs.so === 'number' ? so : this.dependencies.BaseArch.getArchNode(scID).length();
        }
        return {
            scID: scID,
            so: so,
            ecID: ecID,
            eo: eo,
        };
    }
    /**
     * Return the id of what will be the focus node after setting
     * the range to the given points will change the focus node.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Integer}
     */
    _getFutureFocusNode (points) {
        var start = this._targetedNode(points.scID, points.so);
        var end = this._targetedNode(points.ecID, points.eo);

        if (start === end) {
            return start.id;
        } else if (points.scID === points.ecID && points.so === points.eo - 1) {
            return start.id;
        }  else if ((!points.eo || end.id !== points.ecID) && start.isVoidoid() && start === end.previousSibling()) {
            return start.id;
        } else {
            return (start.commonAncestor(end) || start).id;
        }
    }
    /**
     * Return true if the saved range is collapsed.
     *
     * @todo check if public isCollapsed would suffice
     * @private
     * @returns {Boolean}
     */
    _isCollapsed () {
        return this._range.scID === this._range.ecID && this._range.so === this._range.eo;
    }
    /**
     * When pressing the left or right arrow, jump over virtual text nodes.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @param {Object} [options]
     * @param {Boolean} [options.moveLeft] true if a movement is initiated from right to left
     * @param {Boolean} [options.moveRight] true if a movement is initiated from left to right
     * @returns {Object}
     */
    _jumpOverVirtualText (points, options) {
        var oldStart = this.dependencies.BaseArch.getArchNode(this._range.scID);
        var start = this.dependencies.BaseArch.getArchNode(points.scID);
        var oldEnd = this.dependencies.BaseArch.getArchNode(this._range.ecID);
        var end = this.dependencies.BaseArch.getArchNode(points.ecID);
        var isCollapsed = points.scID === points.ecID && points.so === points.eo;
        if (start.id === end.id && start.type === 'TEXT-VIRTUAL') {
            points.eo = points.so;
        }
        // range start is on a virtual node or it already moved from one
        if (options.moveLeft && (start.type === 'TEXT-VIRTUAL' || oldStart.type === 'TEXT-VIRTUAL' && !points.so)) {
            var prev = start.prevUntil(a => a.type !== 'TEXT-VIRTUAL', {doCrossUnbreakables: true, doNotInsertVirtual: true});
            if (prev) {
                points.scID = prev.id;
                points.so = prev.length();
            }
        } else if (options.moveLeft && oldStart.type === 'TEXT-VIRTUAL' && points.so > 0) {
            // range moved from a virtual and is not at the start of prev
            points.so = points.so - 1;
        }
        // range end is on a virtual node or it already moved from one
        if (options.moveRight && (end.type === 'TEXT-VIRTUAL' || oldEnd.type === 'TEXT-VIRTUAL' && points.eo === end.length())) {
            var next = end.nextUntil(a => a.type !== 'TEXT-VIRTUAL', {doCrossUnbreakables: true, doNotInsertVirtual: true});
            if (next) {
                points.ecID = next.id;
                points.eo = next.isText() && end.type === 'TEXT-VIRTUAL' ? 1 : 0;
            }
        } else if (options.moveRight && oldEnd.type === 'TEXT-VIRTUAL' && points.eo < end.length()) {
            // range moved from a virtual and is not at the end of next
            points.eo = points.eo + 1;
        }
        if (isCollapsed) {
            if (options.moveLeft) {
                points.ecID = points.scID;
                points.eo = points.so;
            } else if (options.moveRight) {
                points.scID = points.ecID;
                points.so = points.eo;
            }
        }
        return points;
    }
    /**
     * Move the points out of not-editable nodes.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveOutOfNotEditable (points) {
        var self = this;
        var startPoint = __moveOutOfNotEditable(points.scID, points.so, true) || __moveOutOfNotEditable(points.scID, points.so, false);
        var endPoint = __moveOutOfNotEditable(points.ecID, points.eo, false) || __moveOutOfNotEditable(points.scID, points.so, true);
        function __moveOutOfNotEditable(id, offset, ltr) {
            var archNode = self.dependencies.BaseArch.getArchNode(id);
            while (archNode && !archNode.isRoot() && !archNode.isEditable()) {
                archNode = archNode[ltr ? 'next' : 'prev']({
                    doNotInsertVirtual: true,
                    doCrossUnbreakables: true,
            });
                offset = ltr || !archNode ? 0 : archNode.length();
            }
            return archNode && !archNode.isRoot() ? {
                id: archNode.id,
                offset: offset,
            } : null;
        }
        return {
            scID: startPoint ? startPoint.id : 1,
            so: startPoint ? startPoint.offset : 0,
            ecID: endPoint ? endPoint.id : 1,
            eo: endPoint ? endPoint.offset : 0,
        }
    }
    /**
     * Move the points out of unbreakable nodes.
     * A selection cannot cross the bounds of an unbreakable node.
     * This brings back the end of the selection to the first point that doesn't
     * cross these bounds (respecting the direction of the selection).
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @param {Boolean} ltr true if the selection was made from left to right (from sc to ec)
     * @returns {Object}
     */
    _moveOutOfUnbreakable (points, ltr) {
        var start = this.dependencies.BaseArch.getArchNode(ltr ? points.scID : points.ecID);
        var end = this.dependencies.BaseArch.getArchNode(ltr ? points.ecID : points.scID);
        var startUnbreakable = start.ancestor('isUnbreakable');
        var endUnbreakable = end.ancestor('isUnbreakable');
        if (startUnbreakable.id !== endUnbreakable.id) {
            end = end[ltr ? 'prevUntil' : 'nextUntil'](function (prev) {
                return prev.ancestor('isUnbreakable') === startUnbreakable && prev.isEditable();
            }, {
                doNotInsertVirtual: true,
                doCrossUnbreakables: true,
            });
            if (end) {
                points[ltr ? 'ecID' : 'scID'] = end.id;
                points[ltr ? 'eo' : 'so'] = ltr ? end.length() : 0; // selection from left to right -> move end left
            }
        }
        return points;
    }
    /**
     * Move the points to before an inline node if it's on its left edge.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveToBeforeInline (points) {
        var isCollapsed = points.scID === points.ecID && points.so === points.eo;
        var archSC = this.dependencies.BaseArch.getArchNode(points.scID);
        if (archSC.isVoidoid() || archSC.isVoid()) {
            return points;
        }
        var isLeftEdgeOfInline = !points.so &&
            (archSC.isInlineFormatNode() ||
                archSC.isLeftEdge() && archSC.ancestor('isInlineFormatNode'));
        var prev = archSC.previousSibling();
        if (isCollapsed && isLeftEdgeOfInline && prev) {
            points = this._deducePoints({
                scID: prev.id,
                so: prev.length(),
            });
            points = this._moveToDeepest(points);
        }
        return points;
    }
    /**
     * Move the points to their deepest children.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveToDeepest (points) {
        var self = this;
        var startPoint = __moveToDeepest(points.scID, points.so);
        var endPoint = __moveToDeepest(points.ecID, points.eo);
        function __moveToDeepest(id, offset) {
            var archNode = self.dependencies.BaseArch.getArchNode(id);
            if (!archNode) {
                return;
            }
            while (archNode.childNodes && archNode.childNodes.length && !archNode.isVoidoid()) {
                if (!offset && archNode.previousSibling() && archNode.previousSibling().isTable()) {
                    archNode = archNode.previousSibling().lastLeaf();
                    offset = archNode.length();
                } else {
                    var isAfterEnd = offset >= archNode.childNodes.length;
                    archNode = archNode.nthChild(isAfterEnd ? archNode.childNodes.length - 1 : offset);
                    offset = isAfterEnd ? archNode.length() : 0;
                }
            }
            return {
                id: archNode.id,
                offset: offset,
            };
        };
        if (!startPoint) {
            startPoint = {
                id: 1,
                offset: 0,
            };
        }
        if (!endPoint) {
            endPoint = startPoint;
        }
        return {
            scID: startPoint.id,
            so: startPoint.offset,
            ecID: endPoint.id,
            eo: endPoint.offset,
        };
    }
    /**
     * If the points are collapsed on a first/last BR of a series of BRs
     * and there is something before/after it, move them to the end/start of that
     * something. This ensures proper positioning of the carret in the browser.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveToEdgeOfBRSequence (points) {
        var archNode = this.dependencies.BaseArch.getArchNode(points.scID);
        var isCollapsed = points.scID === points.ecID && points.so === points.eo;
        if (!isCollapsed || !archNode.isBR()) {
            return points;
        }
        var prev = archNode.previousSibling();
        var next = archNode.nextSibling();
        if (!prev || !next) {
            return points;
        }
        var isLeftEdge = !prev.isBR() && next.isBR();
        var isRightEdge = prev.isBR() && !next.isBR();
        if (isRightEdge || isLeftEdge || prev.isText() && next.isText()) {
            return {
                scID: isLeftEdge ? prev.id : next.id,
                so: isLeftEdge ? prev.length() : 0,
                ecID: isLeftEdge ? prev.id : next.id,
                eo: isLeftEdge ? prev.length() : 0,
            };
        }
        return points;
    }
    /**
     * Move the points to within an inline node if it's on its right edge.
     *
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveToEndOfInline (points) {
        var isCollapsed = points.scID === points.ecID && points.so === points.eo;
        var archSC = this.dependencies.BaseArch.getArchNode(points.scID);
        if (archSC.isVoidoid() || archSC.isVoid()) {
            return points;
        }
        var prev = archSC.previousSibling();
        var prevIsInline = prev && prev.isInlineFormatNode();
        if (isCollapsed && !points.so && prevIsInline) {
            points = this._deducePoints({
                scID: prev.id,
                so: prev.length(),
            });
            points = this._moveToDeepest(points);
        }
        return points;
    }
    /**
     * Move the points from in a voidoid to the specified side of it.
     *
     * @param {object} points
     * @param {boolean} moveLeft true to move to the left
     * @returns {object}
     */
    _moveToSideOfVoidoid (points, moveLeft) {
        var scArch = this.dependencies.BaseArch.getArchNode(points.scID);
        var node = scArch[moveLeft ? 'previousSibling' : 'nextSibling']();
        if (node) {
            points.so = points.eo = node.length();
        } else {
            node = scArch.parent;
            points.so = points.eo = moveLeft ? 0 : node.length();
        }
        points.scID = points.ecID = node.id;
        return points;
    }
    /**
     * Move the points from WITHIN a voidoid to select the whole voidoid instead if needed.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Object}
     */
    _moveUpToVoidoid (points) {
        var self = this;
        var startPoint = __moveUpToVoidoid(points.scID, points.so);
        var endPoint = __moveUpToVoidoid(points.ecID, points.eo);
        function __moveUpToVoidoid(id, offset) {
            var archNode = self.dependencies.BaseArch.getArchNode(id);
            if (!archNode) {
                return;
            }
            var voidoidAncestor = archNode.ancestor('isVoidoid', true);
            if (voidoidAncestor) {
                id = voidoidAncestor.id;
                offset = 0;
            }
            return {
                id: id,
                offset: offset,
            };
        }
        return {
            scID: startPoint ? startPoint.id : 1,
            so: startPoint ? startPoint.offset : 0,
            ecID: endPoint ? endPoint.id : (startPoint ? startPoint.id : 1),
            eo: endPoint ? endPoint.offset : (startPoint ? startPoint.offset : 0),
        }
    }
    /**
     * Reset the range on the starting point of the editor.
     *
     * @private
     */
    _reset () {
        this.setRange({
            scID: 1,
            so: 0,
        });
    }
    /**
     * Set the DOM Range from the given points.
     *
     * @private
     * @param {Node} sc
     * @param {Number} so
     * @param {Node} ec
     * @param {Number} eo
     */
    _select (sc, so, ec, eo) {
        if (this.editable.style.display === 'none') {
            return;
        }
        if (this.editable !== document.activeElement) {
            this.editable.focus();
        }
        var nativeRange = this._toNativeRange(sc, so, ec, eo);
        var selection = sc.ownerDocument.getSelection();
        if (selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
        if (!this.document.body.contains(sc)) {
            console.warn("The given range isn't in document.");
            return;
        }
        selection.addRange(nativeRange);
    }
    /**
     * Set the range in the DOM.
     *
     * @private
     * @param {Object} [oldRange]
     * @param {Node} [oldRange.sc]
     * @param {Number} [oldRange.scID]
     * @param {Number} [oldRange.so]
     * @param {Node} [oldRange.ec]
     * @param {Number} [oldRange.ecID]
     * @param {Number} [oldRange.eo]
     * @param {Object} [options]
     * @param {Boolean} [options.muteTrigger]
     * @param {Boolean} [options.muteDOMRange]
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    _setRange (oldRange, options) {
        if (!this._editorFocused) {
            return;
        }

        var newRange = this.getRange();
        var nativeReadyNewRange = this._voidoidSelectToNative(newRange);

        if ((!options || !options.muteDOMRange) &&
            (!oldRange || oldRange.scID === 1 ||
            oldRange.sc !== nativeReadyNewRange.sc || oldRange.so !== nativeReadyNewRange.so ||
            oldRange.ec !== nativeReadyNewRange.ec || oldRange.eo !== nativeReadyNewRange.eo)) {
            // only if the native range change, after the redraw
            // the renderer can associate existing note to the arch (to prevent error on mobile)
            this._select(nativeReadyNewRange.sc, nativeReadyNewRange.so, nativeReadyNewRange.ec, nativeReadyNewRange.eo);
        }

        var didRangeChange = this._didRangeChange;
        var isChangeFocusNode = this._didChangeFocusNode;
        this._didRangeChange = false;
        this._didChangeFocusNode = false;

        var res = {};
        if (didRangeChange) {
            res.range = this.toJSON();
            if (!options || !options.muteTrigger) {
                this.trigger('range', res.range);
            } else {
                // this._didRangeChange = didRangeChange; // TODO: fix undo
            }
        }
        if (isChangeFocusNode) {
            res.focus = this.getFocusedNode();
            if (!options || !options.muteTrigger) {
                this.trigger('focus', res.focus);
            } else {
                this._didChangeFocusNode = isChangeFocusNode;
            }
        }

        return res;
    }
    /**
     * Set the range from the selection in the DOM.
     *
     * @private
     * @param {Object} [options]
     * @param {Boolean} [options.moveLeft] true if a movement is initiated from right to left
     * @param {Boolean} [options.moveRight] true if a movement is initiated from left to right
     */
    _setRangeFromDOM (options) {
        var range = this.getRangeFromDOM();
        if (!range.scID || range.scArch && (range.scArch.type === 'TEXT-VIRTUAL' ? 1 : range.scArch.length()) < range.so ||
            !range.ecID || range.scArch && (range.scArch.type === 'TEXT-VIRTUAL' ? 1 : range.ecArch.length()) < range.eo) {
            console.warn("Try to take the range from DOM but does not seem synchronized", range);
            return;
        }
        range = this._voidoidSelectToWE3(range);
        this._computeSetRange(range, options);
        this._setRange(range);
    }
    /**
     * Return the node targeted by the given ArchNode ID and its offset.
     *
     * @private
     * @param {Number} id
     * @param {Number} offset
     * @returns {ArchNode}
     */
    _targetedNode (id, offset) {
        var archNode = this.dependencies.BaseArch.getArchNode(id);
        if (archNode && !archNode.isVoidoid() && archNode.childNodes && archNode.childNodes[offset]) {
            archNode = archNode.childNodes[offset];
        }
        return archNode;
    }
    /**
     * Get the native Range object corresponding to the given range points.
     *
     * @private
     * @param {Node} sc
     * @param {Number} so
     * @param {Node} ec
     * @param {Number} eo
     * @returns {Range}
     */
    _toNativeRange (sc, so, ec, eo) {
        var nativeRange = sc.ownerDocument.createRange();
        nativeRange.setStart(sc, so);
        nativeRange.setEnd(ec, eo);
        return nativeRange;
    }
    /**
     * Convert a range to ensure compatibility with native range,
     * with regards to voidoid selection.
     * In we3, a selected voidoid is within the voidoid.
     * For a native range, we need to select the voidoid from within its parent.
     *
     * @private
     * @see _voidoidSelectToWE3
     * @param {object} range
     * @param {Node} range.sc
     * @param {number} range.so
     * @param {Node} range.ec
     * @param {number} range.eo
     * @returns {object} {sc, so, ec, eo}
     */
    _voidoidSelectToNative (range) {
        var sc = range.sc;
        var so = range.so;
        if (range.scArch.isVoidoid() && sc && sc.parentNode) {
            so = [].indexOf.call(sc.parentNode.childNodes, sc);
            sc = sc.parentNode;
        }
        var ec = range.ec;
        var eo = range.eo;
        if (range.ecArch.isVoidoid() && sc && sc.parentNode) {
            eo = [].indexOf.call(ec.parentNode.childNodes, ec);
            ec = ec.parentNode;
        }
        return {
            sc: sc,
            so: so,
            ec: ec,
            eo: eo,
        };
    }
    /**
     * Convert a native voidoid selection to ensure deepest selection.
     * For a native range, we need to select the voidoid from within its parent.
     * In we3, a selected voidoid is within the voidoid.
     *
     * @private
     * @see _voidoidSelectToNative
     * @param {object} range
     * @param {ArchNode} range.scArch
     * @param {number} range.so
     * @param {ArchNode} range.ecArch
     * @param {number} range.eo
     * @returns {object} {scID, so, ecID, eo}
     */
    _voidoidSelectToWE3 (range) {
        if (!range.scArch || !range.ecArch) {
            return range;
        }
        if (!range.isCollapsed() && range.scArch.isText() && range.so === range.scArch.length() && range.scArch.nextSibling() && range.scArch.nextSibling().isVoidoid()) {
            range.scID = range.scArch.nextSibling().id;
            range.so = 0;
        }
        if (!range.isCollapsed() && range.ecArch.isText() && range.eo === 0 && range.ecArch.previousSibling() && range.ecArch.previousSibling().isVoidoid()) {
            range.ecID = range.ecArch.previousSibling().id;
            range.eo = 0;
        }
        return range;
    }
    /**
     * Return true if the range will change once set to the given points.
     *
     * @private
     * @param {Object} points
     * @param {Number} points.scID
     * @param {Number} points.so
     * @param {Number} points.ecID
     * @param {Number} points.eo
     * @returns {Boolean}
     */
    _willRangeChange (points) {
        var willOffsetChange = points.so !== this._range.so || points.eo !== this._range.eo;
        var willIDsChange = points.scID !== this._range.scID || points.ecID !== this._range.ecID;
        var willNodesChange = this.dependencies.BaseRenderer.getElement(points.scID) !== this.dependencies.BaseRenderer.getElement(this._range.scID) ||
            this.dependencies.BaseRenderer.getElement(points.ecID) !== this.dependencies.BaseRenderer.getElement(this._range.ecID);
        return willOffsetChange || willIDsChange || willNodesChange;
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {MouseEvent} e
     */
    _onClick (e) {
        e.preventDefault();
    }
    /**
     * @private
     * @param {KeyEvent} e
     */
    _onKeydown (e) {
        if (e.keyCode !== 38 && e.keyCode !== 40) { // up and down arrow
            return;
        }
        var self = this;
        this._keydownNavigationKey = [];
        this.dependencies.Arch.getClonedArchNode(1).nextUntil(function (next) {
            if (next.isVoidoid() && !next.isVoid() && !next.isText()) {
                var el = self.dependencies.Renderer.getElement(next.id);
                if (el) {
                    el.setAttribute('contenteditable', 'false');
                    self._keydownNavigationKey.push(next.id);
                }
            }
        });
    }
    /**
     * @private
     * @param {KeyEvent} e
     */
    _onKeyup (e) {
        var self = this;
        var isSelectAll = e.ctrlKey && e.key === 'a';
        if (isSelectAll) {
            return this.selectAll();
        }
        var isNavigationKey = e.keyCode >= 33 && e.keyCode <= 40;
        if (isNavigationKey) {
            this._setRangeFromDOM({
                moveLeft: e.keyCode === 37 || e.keyCode === 38,
                moveRight: e.keyCode === 39 || e.keyCode === 40,
            });
        }
        if (e.keyCode === 38 || e.keyCode === 40) {
            this._keydownNavigationKey.forEach(function (id) {
                self.dependencies.Renderer.getElement(id).removeAttribute('contenteditable', 'false');
            });
        }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onMouseDown (e) {
        this._mousedownInEditable = this.editable === e.target || this.editable.contains(e.target);
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onMouseUp (e) {
        if (!this._mousedownInEditable) {
            return;
        }
        this._mousedownInEditable = false;
        this._setRangeFromDOM();
        if (!this.editor.contains(e.target) || this.editable === e.target || this.editable.contains(e.target)) {
            return;
        }
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            this.editable.focus();
            this.restore();
        }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onMouseUpEditable (e) {
        var range = this.getRangeFromDOM();
        if (!range || range.sc !== e.target && !e.target.contains(range.sc) && range.ec !== e.target && !e.target.contains(range.ec)) {
            var archNodeID = this.dependencies.Renderer.getID(e.target);
            var archNode = archNodeID && this.dependencies.Arch.getClonedArchNode(archNodeID);
            var voidoid = archNode && archNode.ancestor('isVoidoid', true);
            if (voidoid) {
                this.setRange({
                    scID: voidoid.id,
                    so: 0,
                });
            }
        }
    }
};

we3.pluginsRegistry.BaseRange = BaseRange;

})();
