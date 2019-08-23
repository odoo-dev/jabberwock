(function () {
'use strict';

var Range = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseRange'];
    }
    on () {
        var BaseRange = this.dependencies.BaseRange;
        BaseRange.on.apply(BaseRange, arguments);
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
        return this.dependencies.BaseRange.getFocusedNode();
    }
    /**
     * Get the current range.
     *
     * @returns {WrappedRange}
     */
    getRange () {
        return this.dependencies.BaseRange.getRange();
    }
    /**
     * Returns a list of all selected leaves in the range.
     *
     * @returns {ArchNode []}
     */
    getSelectedLeaves () {
        return this.dependencies.BaseRange.getSelectedLeaves();
    }
    /**
     * Returns a list of all selected nodes in the range.
     *
     * @param {function} [pred]
     * @returns {ArchNode []}
     */
    getSelectedNodes (pred) {
        return this.dependencies.BaseRange.getSelectedNodes(pred);
    }
    /**
     * Return true if the start range is the same point as the end range.
     *
     * @returns {Boolean}
     */
    isCollapsed () {
        return this.dependencies.BaseRange.isCollapsed();
    }
    /**
     * Return range points from the from `startID` to `endID`.
     *
     * @param {Number} startID
     * @param {Number} endID
     * @returns {Object} {scID: {Number}, so: {Number}, ecID: {Number}, eo: {Number}}
     */
    rangeOn (startID, endID) {
        return this.dependencies.BaseRange.rangeOn(startID, endID);
    }
    /**
     * Restore the range to its last saved value.
     *
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    restore () {
        return this.dependencies.BaseRange.restore();
    }
    /**
     * Select all the contents of the previous start container's first
     * unbreakable ancestor
     */
    selectAll () {
        return this.dependencies.BaseRange.selectAll();
    }
    /**
     * Set the range and apply it.
     * Pass only `points.scID` to set the range on the whole element.
     * Pass only `points.scID` and `points.so` to collapse the range on the start.
     *
     * @param {Object} points
     * @param {Node} points.scID
     * @param {Number} [points.so]
     * @param {Node} [points.ecID]
     * @param {Number} [points.eo] must be given if ecID is given
     * @param {Boolean} [points.ltr] true if the selection was made from left to right (from sc to ec)
     * @param {Object} [options]
     * @param {Boolean} [options.moveLeft] true if a movement is initiated from right to left
     * @param {Boolean} [options.moveRight] true if a movement is initiated from left to right
     * @param {Boolean} [options.muteTrigger]
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    setRange (range, options) {
        return this.dependencies.BaseRange.setRange(range, options);
    }
    /**
     * Return a deep copy of the range values.
     *
     * @returns {Object}
     */
    toJSON () {
        return this.dependencies.BaseRange.toJSON();
    }
};

we3.pluginsRegistry.Range = Range;

})();
