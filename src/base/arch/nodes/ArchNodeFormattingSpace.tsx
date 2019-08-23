(function () {
'use strict';

var ArchitecturalSpace = class extends we3.ArchNodeText {
    get type () {
        return 'ArchitecturalSpace';
    }

    //--------------------------------------------------------------------------
    // Public: Export
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    toJSON (options) {
        if (this.__removed || !options || !options.architecturalSpace) {
            return null;
        }
        return {
            nodeValue: this.toString(options),
        };
    }
    /**
     * @override
     */
    toString (options) {
        var space = '';

        if (!this.__removed && options && options.architecturalSpace) {
            var indent = typeof options.architecturalSpace === 'integer' ? options.architecturalSpace : 4;

            space = '\n';

            var level = -1; // remove editable indent
            var node = this;
            while (node.parent) {
                if (!node.isVirtual() || options.keepVirtual) {
                    level++;
                }
                node = node.parent;
            }

            level -= (this.nextSibling(null, true) ? 0 : 1);

            if (level > 0) {
                space += (new Array(level * indent + 1).join(' '));
            }
        }
        return space;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    insert (archNode, offset) {
        if (archNode.isFragment()) {
            return this._insertFragment(archNode, offset);
        }
        return this.parent.insert(archNode, this.index());
    }
    /**
     * @override
     */
    isArchitecturalSpace () {
        return true;
    }
    /**
     * @override
     */
    isBlankNode () {
        return true;
    }
    /**
     * @override
     */
    isBlankText () {
        return true;
    }
    /**
     * @override
     */
    isEmpty () {
        return true;
    }
    /**
     * @override
     */
    isVisibleText () {
        return false;
    }
    /**
     * @override
     */
    length () {
        return 0;
    }
    /**
     * @override
     */
    split () {
        return false;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _addArchitecturalSpaceNodes () {}
    /**
     * @override
     */
    _nextSibling (fn) {
        return this.nextSibling(fn);
    }
    /**
     * @override
     */
    _previousSibling (fn) {
        return this.previousSibling(fn);
    }
};
we3.addArchNode('ArchitecturalSpace', ArchitecturalSpace);

})();
