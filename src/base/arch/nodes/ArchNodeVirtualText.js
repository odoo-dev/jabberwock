(function () {
'use strict';

we3.ArchNodeVirtualText = class extends we3.ArchNodeText {
    static parse (archNode, options) {
        if (archNode.isText() && archNode.nodeValue && archNode.nodeValue.indexOf('\uFEFF') !== -1) {
            var fragment = new we3.ArchNodeFragment(archNode.params);
            archNode.nodeValue.split('\uFEFF').forEach(function (text, i) {
                if (i) {
                    fragment.childNodes.push(new we3.ArchNodeVirtualText(archNode.params));
                }
                if (text.length) {
                    fragment.childNodes.push(new we3.ArchNodeText(archNode.params, null, null, text));
                }
            });
            return fragment;
        }
    }

    constructor () {
        super(...arguments);
        this.nodeValue = '\uFEFF';
    }
    get type () {
        return 'TEXT-VIRTUAL';
    }

    //--------------------------------------------------------------------------
    // Public: export
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    toJSON (options) {
        if (!options || !options.keepVirtual) {
            return null;
        }
        return super.toJSON(options);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    insert (archNode, offset) {
        if (!this.isAllowUpdate()) {
            console.warn("can not insert in not editable node");
            return [];
        }

        if (archNode.isFragment()) {
            return this._insertFragment(archNode, offset);
        }
        var prev = this.previousSibling();
        if (this.parent.isEmpty() && archNode.isBR()) {
            var parent = this.parent;
            var index = this.index();
            this.applyRules();
            return parent.insert(archNode, index);
        }
        var res = [];
        if (prev && prev.isText()) {
            res = prev.insert(archNode, prev.length());
        } else {
            res = this.parent.insert(archNode, this.index());
        }
        this.remove();
        return res;
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
    isVirtual () {
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
    setNodeValue (nodeValue) {
        if (!this.isAllowUpdate()) {
            console.warn("can not update a not editable node");
            return [];
        }

        var archNode = this.params.create(null, null, nodeValue);
        var res = this.parent.insert(archNode, this.index());
        this.remove();
        return res;
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
    _applyRulesArchNode () {
        var self = this;
        if (this.parent && (this.parent.isList() || this.parent.isRoot())) {
            return this._mutation('br');
        }

        // <p>text<br/>[VIRTUAL]</p> => mutate virtual into <br/> to persist it
        var prev = this.previousSibling();
        if (prev && prev.isBR() && this.isRightEdgeOfBlock()) {
            return this._mutation('br');
        }

        var flowBlock = this.ancestor('isFlowBlock');
        if (!flowBlock) {
            return this.remove();
        }

        if (flowBlock.isDeepEmpty()) {
            if (flowBlock.id === this.parent.id) {
                var siblings = flowBlock.childNodes.filter(function (n) {
                    return n.isVirtual() && n.id !== self.id;
                });
                siblings.slice().forEach(n => n.remove());
            }
            return this._mutation('br');
        }
    }
    /**
     * Mutate the VirtualText from VirtualText to `nodeName`.
     *
     * @param {string} nodeName
     */
    _mutation (nodeName) {
        var archNode = this.params.create(nodeName);
        archNode.id = this.id;
        this.before(archNode);
        this.remove();
    }
};

})();
