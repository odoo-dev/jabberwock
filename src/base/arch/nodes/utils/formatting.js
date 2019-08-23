(function () {
'use strict';

var we3 = window.we3;

we3.ArchNode = class extends we3.ArchNode {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    toJSON (options) {
        var self = this;
        if (options && options.architecturalSpace && !options.noInsert && !options._flagArchitecturalSpace) {
            options._flagArchitecturalSpace = true;
            this.params.bypassUpdateConstraints(function () {
                self._addArchitecturalSpaceNodes(true);
            });
            var value = super.toJSON(options);
            this.params.bypassUpdateConstraints(function () {
                self._removeAllArchitecturalSpace();
            });
            return value.trim();
        }
        return super.toJSON(options);
    }
    /**
     * @override
     */
    toString (options) {
        var self = this;
        if (options && options.architecturalSpace && !options.noInsert && !options._flagArchitecturalSpace) {
            options._flagArchitecturalSpace = true;
            this.params.bypassUpdateConstraints(function () {
                self._addArchitecturalSpaceNodes(true);
            });
            var value = super.toString(options);
            this.params.bypassUpdateConstraints(function () {
                self._removeAllArchitecturalSpace();
            });
            return value.trim();
        }
        return super.toString(options);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Add an architectural space node.
     *
     * @see https://google.github.io/styleguide/htmlcssguide.html#General_Formatting
     * @private
     */
    _addArchitecturalSpaceNode () {
        if (this.__removed || !this.parent || this.parent.isInPre()) {
            return;
        }

        var parentIsBlock = this.parent.isBlock();
        if (this.isBlock()) {
            if (parentIsBlock || this.parent.isRoot() && this.previousSibling()) {
                this.before(this.params.create('ArchitecturalSpace'));
                if (!this.nextSibling()) {
                    this.after(this.params.create('ArchitecturalSpace'));
                }
            }
        // } else if (parentIsBlock) { // TODO à discuter, espace au debut et fin des blocks
        //     if (!this.previousSibling()) {
        //         this.before(this.params.create('ArchitecturalSpace'));
        //     }
        //     if (!this.nextSibling()) {
        //         this.after(this.params.create('ArchitecturalSpace'));
        //     }
        }
    }
    /**
     * Add architectural space nodes into this node and all its descendents.
     *
     * @private
     */
    _addArchitecturalSpaceNodes (isRoot) {
        if (!isRoot) {
            this._addArchitecturalSpaceNode();
        }
        var visibleChildren = this.visibleChildren();
        if (visibleChildren) {
            visibleChildren.forEach(function (child) {
                child._addArchitecturalSpaceNodes(false);
            });
        }
    }
    /**
     * Remove all architectural space from the Arch.
     */
    _removeAllArchitecturalSpace () {
        var toRemove = [];
        var node = this.ancestor('isRoot');
        while (node) {
            node = node.walk(false, function (next) {
                if (next && next.isArchitecturalSpace()) {
                    toRemove.push(next);
                }
            });
        }
        toRemove.forEach(function (node) {
            node.remove();
        });
    }
};

})();
