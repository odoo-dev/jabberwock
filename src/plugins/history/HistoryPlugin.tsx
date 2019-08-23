(function () {
'use strict';

const regex = we3.utils.regex.History;

class HistoryPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        /**
         * {Object|undefined [] []}
         * Each sublist represent the ArchNode that has its index as ID.
         * In that sublist, each value is a step in the history.
         * Each step is either a object detailing the changes made or
         * undefined if there was no change.
         *             Step ID
         * ArchNode ID [ ]    [ ]    [ {Object | undefined}]
         *             [ ]    [ ]    [ ]
         *             [ ]    [ ]    [ ]
         *
         * @property eachNodeHistory
         */
        this._eachNodeHistory = [[]];
        this._range = [];

        this.templatesDependencies = ['src/xml/history.xml'];
        this.dependencies = ['Arch', 'Range'];
        this.buttons = {
            template: 'wysiwyg.buttons.history',
            enabled: '_enabled',
        };
    }
    setEditorValue () {
        this.clear();
    }
    start () {
        this.dependencies.Arch.on('update', this, this._onArchUpdate.bind(this));
        this.dependencies.Range.on('range', this, this._onArchRange.bind(this));
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Clear the history.
     */
    clear () {
        // Clear the stack.
        this._eachNodeHistory = [[]];
        this._range = [];
        // Restore stackOffset to its original value.
        this.stackOffset = -1;
        // Record our first snapshot (of nothing).
        var json = this.dependencies.Arch.toJSON({keepVirtual: true});
        var changes = [];

        (function flatChanges (json) {
            changes.push(json);
            if (json.childNodes) {
                json.childNodes = json.childNodes.map(flatChanges);
            }
            return json.id;
        })(json);

        this._onArchUpdate(changes);
    }
    /**
     * Redo the last undone history step.
     */
    redo () {
        if (this._range.length - 1 > this.stackOffset) {
            var oldOffset = this.stackOffset;
            this.stackOffset++;
            this._muteUpdate = true;
            var diff = this._getStepDiff(this.stackOffset, oldOffset);
            var range = this._range[this.stackOffset];
            this.dependencies.Arch.importUpdate(diff, range);
            this._muteUpdate = false;
            if (!diff.length) {
                this.redo();
            }
        }
    }
    /**
     * Undo the last history step.
     */
    undo () {
        if (this.stackOffset > 0) {
            var oldOffset = this.stackOffset;
            this.stackOffset--;
            this._muteUpdate = true;
            var diff = this._getStepDiff(this.stackOffset, oldOffset);
            var range = this._range[this.stackOffset];
            this.dependencies.Arch.importUpdate(diff, range);
            this._muteUpdate = false;
            if (!diff.length) {
                this.undo();
            }
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @param {String} buttonName
     * @param {Node} focusNode
     * @returns {Boolean} true if the given button should be enabled
     */
    _enabled (buttonName) {
        if (buttonName === 'undo') {
            var steps = this._eachNodeHistory[0].slice(0, this.stackOffset + 1);
            var nb = steps.length ? steps.reduce(function (a, b) {return a + b;}) : 0;
            return nb > 1;
        } else if (buttonName === 'redo') {
            return this.stackOffset + 1 < this._range.length;
        }
    }
    /**
     * Get the step at given offset.
     *
     * @private
     * @param {Number} oldOffset
     * @returns {Object|undefined []}
     */
    _getStep (oldOffset) {
        var nodes = [];
        this._eachNodeHistory.forEach(function (nodeHistory, id) {
            var offset = oldOffset;
            var snapshot = nodeHistory[offset];
            while (!snapshot && offset > 0) {
                offset--;
                snapshot = nodeHistory[offset];
            }
            nodes[+id] = snapshot;
        });
        return nodes;
    }
    /**
     * Get the IDs of node that have changes in the given step.
     *
     * @private
     * @param {Object} step
     * @returns {Number[]}
     */
    _getStepActiveIds (step) {
        var ids = [];
        (function lookChildren (id) {
            ids.push(id);
            if (step[id] && step[id].childNodes) {
                step[id].childNodes.forEach(lookChildren);
            }
        })(1);
        return ids.sort();
    }
    /**
     * Get the difference between two steps.
     *
     * @private
     * @param {Number} newOffset
     * @param {Number} oldOffset
     * @returns {Object []}
     */
    _getStepDiff (newOffset, oldOffset) {
        var diff = [];
        var newStep = this._getStep(this.stackOffset);
        var oldStep = this._getStep(oldOffset);

        var oldIds = this._getStepActiveIds(oldStep);
        var newIds = this._getStepActiveIds(newStep);

        newStep.forEach(function (json) {
            if (!json || newIds.indexOf(json.id) === -1) {
                return;
            }
            if (oldIds.indexOf(json.id) === -1 || json !== oldStep[json.id]) {
                diff.push(json);
            }
        });
        return diff;
    }
    /**
     * On range change, take a snapshot of the current range position.
     *
     * @private
     * @param {Object} range
     * @param {Number} range.scID
     * @param {Number} range.so
     * @param {Number} range.ecID
     * @param {Number} range.eo
     */
    _onArchRange (range) {
        if (this._muteUpdate) {
            return;
        }
        if (this.stackOffset < this._eachNodeHistory[0].length -1) {
            return;
        }

        if (this._eachNodeHistory[0][this.stackOffset] &&
            !this._eachNodeHistory[0][this.stackOffset + 1] &&
                (!this._range[this.stackOffset] ||
                    this._range[this.stackOffset].scID !== range.scID ||
                    this._range[this.stackOffset].so !== range.so ||
                    this._range[this.stackOffset].ecID !== range.ecID ||
                    this._range[this.stackOffset].eo !== range.eo
                )
            ) {
            this.stackOffset++;
        }
        this._range[this.stackOffset] = range;
    }
    /**
     * On Arch update, update the history.
     *
     * @private
     * @param {Object []} diffToNew
     */
    _onArchUpdate (diffToNew) {
        var self = this;
        if (this._muteUpdate) {
            return;
        }

        var old = this._getStep(this.stackOffset);

        var concatTextHistory = false;
        if (diffToNew.length === 1 && diffToNew[0].type === 'TEXT') {
            var nodeHistory = this._eachNodeHistory[diffToNew[0].id];
            var step = nodeHistory && nodeHistory[this.stackOffset];
            if (step) {
                // break the history for each space or ponctuation
                concatTextHistory = step.nodeValue.split(regex.spacePonctu).length === diffToNew[0].nodeValue.split(regex.spacePonctu).length;
            }
        }

        if (!concatTextHistory) {
            this.stackOffset++;
        }

        // Wash out stack after stackOffset
        if (this._range.length > this.stackOffset) {
            this._eachNodeHistory.forEach(function (nodeHistory) {
                if (nodeHistory) {
                    nodeHistory.splice(self.stackOffset);
                }
            });
            this._range = this._range.slice(0, this.stackOffset);
        }

        this._eachNodeHistory[0][this.stackOffset] = true;

        diffToNew.forEach(function (json) {
            var nodeHistory = self._eachNodeHistory[json.id];
            if (!nodeHistory) {
                self._eachNodeHistory[json.id] = nodeHistory = [];
            }
            if (json.childNodes) {
                json.childNodes = json.childNodes.map(function (child) {
                    return child.id || child;
                });
            }
            var oldJSON = old[json.id];
            if (oldJSON) {
                if (JSON.stringify(oldJSON) === JSON.stringify(json)) {
                    return;
                }
            }
            nodeHistory[self.stackOffset] = json;
        });

        this._range[this.stackOffset] = this.dependencies.Range.toJSON();
    }
}

we3.addPlugin('History', HistoryPlugin);

})();
