(function () {
'use strict';

we3.WrappedRange = class we3 {
    /**
     * Note: the range is initialized on the given points.
     *  - If no end point is given:
     *      the range is collapsed on its start point
     *  - If no start offset is given:
     *      the range is selecting the whole start node
     *  - If no start point or start offset or range is given:
     *      get the current range from the selection in the DOM (native range).
     *
     * The WrappedRange object contains the following keys:
     * - scId   {Number}    ID in the Arch of the start node
     * - scArch {ArchNode}  ArchNode object representing the start node
     * - sc     {Node}      start node in the DOM
     * - so     {Number}    offset within the start node
     * - ecId   {Number}    ID in the Arch of the end node
     * - ecArch {ArchNode}  archNode object representing the end node
     * - ec     {Node}      end node in the DOM
     * - eo     {Number}    offset within the end node
     * - ltr    {Boolean}   (default: true) true if the selection was made
     *                      from left to right (ie from sc to ec),
     *                      or if range is collapsed
     *
     * @param {Plugin} ArchPlugin
     * @param {Plugin} RendererPlugin
     * @param {Object} [range]
     * @param {Node} [range.sc]
     * @param {Number} range.so
     * @param {Node} [range.ec]
     * @param {Number} [range.eo]
     */
    constructor (ArchPlugin, RendererPlugin, range) {
        this.ArchPlugin = ArchPlugin;
        this.RendererPlugin = RendererPlugin;
        this.document = ArchPlugin.editable.ownerDocument;

        if (!range || !Object.keys(range).length) {
            this.getFromSelection();
        } else if (typeof range.so !== 'number') {
            if (range.scArch || range.scID || range.sc) {
                this.getFromNode(range.scArch || range.scID || range.sc);
            } else {
                this.getFromSelection();
            }
        } else {
            this.replace(range);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Collapse the current range on its end point
     * (or start point if isCollapseToStart is true).
     *
     * @param {Boolean} isCollapseToStart
     * @returns {WrappedRange}
     */
    collapse (isCollapseToStart) {
        if (isCollapseToStart) {
            return this.replace({
                scID: this.scID,
                so: this.so,
                ecID: this.scID,
                eo: this.so,
            });
        } else {
            return this.replace({
                scID: this.ecID,
                so: this.eo,
                ecID: this.ecID,
                eo: this.eo,
            });
        }
    }
    /**
     * Get the common ancestor of the start and end
     * points of the current range.
     *
     * @returns {Node}
     */
    commonAncestor () {
        return this.scArch.commonAncestor(this.ecArch);
    }
    /**
     * Get the direction of the selection from the Selection Object
     *
     * @see https://www.w3.org/TR/selection-api/
     * @param {Selection} selection
     * @param {Range} nativeRange
     * @returns {Boolean} true if the selection was made from left to right
     *                    or range is collapsed
     */
    getDirection (selection, nativeRange) {
        if (selection.anchorNode === selection.focusNode) {
            return selection.anchorOffset <= selection.focusOffset;
        }
        return selection.anchorNode === nativeRange.startContainer;
    }
    /**
     * Move the current range to the given node
     * (from its start to its end unless it's a void node).
     *
     * @param {Node} node
     * @returns {WrappedRange}
     */
    getFromNode (node) {
        var id, arch, len = 0;
        if (typeof node === 'object' && 'isRoot' in node && 'isUnbreakable' in node) {
            id = null;
            arch = node;
            node = null;
            len = arch.length();
        } else if (typeof node === 'number') {
            id = node;
            arch = null;
            node = null;
            len = this.ArchPlugin.getClonedArchNode(id).length();
        } else {
            if (node.nodeType === 3) {
                len = node.nodeValue.length;
            } else if (node) {
                len = node.childNodes.length;
            }
        }
        var range = {
            scID: id,
            scArch: arch,
            sc: node,
            so: 0,
            ecID: id,
            ecArch: arch,
            ec: node,
            eo: len,
        };
        return this.replace(range);
    }
    /**
     * Move the current range to the current selection in the DOM
     * (the native range).
     *
     * @returns {WrappedRange}
     */
    getFromSelection () {
        var selection = this.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        var nativeRange = selection.getRangeAt(0);
        var ltr = this.getDirection(selection, nativeRange);
        return this.replace({
            sc: nativeRange.startContainer,
            so: nativeRange.startOffset,
            ec: nativeRange.endContainer,
            eo: nativeRange.endOffset,
            ltr: ltr,
        });
    }
    /**
     * Get the current selection from the DOM.
     *
     * @returns {Selection}
     */
    getSelection () {
        return this.document.getSelection();
    }
    /**
     * Return true if the current range is collapsed
     * (its start and end offsets/nodes are the same).
     *
     * @returns {Boolean}
     */
    isCollapsed () {
        return this.scID === this.ecID && this.so === this.eo;
    }
    /**
     * Move the range to the given points.
     * It's possible to not pass two complete points:
     * - If only sc (technically, if no so) or if argument[0] is a Node:
     *  the range is a selection of the whole start container
     * - If only sc and so:
     *  the range is collapsed on its start point
     * - If only sc, so and eo (technically, if no so and no eo):
     *  the range is a selection on the start container at given offsets
     *
     * @param {Object|WrappedRange|Node} range
     * @param {Node} [range.sc]
     * @param {Number} [range.so]
     * @param {Node} [range.ec]
     * @param {Number} [range.eo]
     * @returns {WrappedRange}
     */
    replace (range) {
        if (!range.so && range.so !== 0) {
            var node = range.sc || range; // allow passing just a node
            range = this.getFromNode(node);
        }

        this.ltr = typeof range.ltr === 'undefined' ? true : range.ltr;
        this.scID = range.scID;
        this.scArch = range.scArch;
        this.sc = range.sc;
        if (!this.scID && this.scArch) {
            this.scID = this.scArch.id;
        }
        if (!this.scID && this.sc) {
            this.scID = this.RendererPlugin.getID(this.sc);
        }
        this.scArch = this.scArch;
        if (!this.scArch && this.scID) {
            this.scArch = this.ArchPlugin.getClonedArchNode(this.scID);
        }
        this.sc = this.RendererPlugin.getElement(this.scID);

        this.ecID = range.ecID;
        this.ecArch = range.ecArch;
        this.ec = range.ec;
        if (!this.ecID && this.ecArch) {
            this.ecID = this.ecArch.id;
        }
        if (!this.ecID && this.ec) {
            this.ecID = this.RendererPlugin.getID(this.ec);
        }
        if (!this.ecID) {
            this.ecID = this.scID;
        }
        if (!this.ecArch && this.ecID) {
            this.ecArch = this.ArchPlugin.getClonedArchNode(this.ecID);
        }
        this.ec = this.RendererPlugin.getElement(this.ecID);

        this.so = range.so;
        this.eo = range.eo;

        if (!this.eo && this.eo !== 0) {
            return this.collapse(true);
        }
        return this;
    }
};


})();