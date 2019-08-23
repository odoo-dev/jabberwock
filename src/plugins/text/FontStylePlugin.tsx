(function () {
'use strict';

class FontStylePlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Media', 'Range', 'Text'];
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_format_text.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.fontstyle',
            active: '_active',
            enabled: '_enabled',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Format a 'format' block: change its tagName (eg: p -> h1).
     *
     * @param {string} nodeName
     *       P, H1, H2, H3, H4, H5, H6, BLOCKQUOTE, PRE
     */
    formatBlock (nodeName) {
        var self = this;
        var selection = this.dependencies.Range.getSelectedNodes();
        var styleAncestors = [];
        selection.map(function (node) {
            var ancestor = node.ancestor((a) => self.options.styleTags.indexOf(a.nodeName) !== -1);
            if (ancestor && ancestor.isEditable()) {
                styleAncestors.push(ancestor.id);
            }
        });
        this.dependencies.Arch.wrap(this.utils.uniq(styleAncestors), nodeName);
    }
    /**
     * (Un-)format text: make it bold, italic, ...
     *
     * @param {string} nodeName
     *       B, I, U, S, SUP, SUB
     */
    formatText (nodeName) {
        var range = this.dependencies.Range.getRange();
        var selectedTextNodes = this.dependencies.Range.getSelectedNodes((node) => node.isText() || node.isVoidoid());
        if (selectedTextNodes.length && selectedTextNodes.every((node) => node.ancestor((a) => a.nodeName === nodeName))) {
            this.dependencies.Arch.unwrapRangeFrom(nodeName);
        } else {
            this.dependencies.Arch.wrapRange(nodeName);
        }
        if (range.scID !== range.ecID) {
            this.dependencies.Range.setRange(range);
        }
    }
    /**
     * Remove format on the current range. If the range is collapsed, remove
     * the format of the current node (`focusNode`).
     *
     * @see utils.formatTags the list of removeFormat candidates as defined by W3C
     * @param {null} value
     * @param {ClonedClass} focusNode
     */
    removeFormat (value, focusNode) {
        var range = this.dependencies.Range.getRange();
        // Unwrap everything at range from the removeFormat candidates
        if (this.dependencies.Range.isCollapsed()) {
            this.dependencies.Arch.unwrapFrom(focusNode.id, we3.tags.format);
        } else {
            this.dependencies.Arch.unwrapRangeFrom(we3.tags.format);
        }
        // Reset the range if it was across several node (otherwise let Arch handle it)
        if (range.scID !== range.ecID) {
            this.dependencies.Range.setRange(range);
        }
        // Remove the styles of everything at range
        var unstyledNodes = [];
        if (this.dependencies.Range.isCollapsed()) {
            unstyledNodes = this._unstyle(this.dependencies.Range.scArch);
        } else {
            unstyledNodes = this._unstyle(this.dependencies.Range.getSelectedNodes());
        }
        // Render anew if anything changed
        if (unstyledNodes.length) {
            var parentsOfUnstyledNodes = we3.utils.uniq(unstyledNodes.map(node => node.parent));
            var json = parentsOfUnstyledNodes.map(node => node.toJSON());
            this.dependencies.Arch.importUpdate(json);
            this.dependencies.Range.setRange(range);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {String} buttonName
     * @param {WrappedRange} range
     * @returns {Boolean} true if the given button should be active
     */
    _active (buttonName, focusNode) {
        var formatName = buttonName.split('-')[1].toLowerCase();
        switch (buttonName.split('-', 1)[0]) {
            case 'formatBlock':
                var formatBlockAncestor = focusNode.ancestor(function (n) {
                    return n.isFormatNode();
                });
                if (!formatBlockAncestor) {
                    return buttonName === 'formatBlock-p';
                }
                return formatBlockAncestor.nodeName === formatName ||
                    formatBlockAncestor.className.contains(formatName);
            case 'formatText':
                if (formatName === 'remove') {
                    return false;
                }
                return !!focusNode.isInTag(formatName);
        }
        return false;
    }
    /**
     * @private
     * @param {String} buttonName
     * @param {Node} focusNode
     * @returns {Boolean} true if the given button should be enabled
     */
    _enabled (buttonName, focusNode) {
        return !!this.dependencies.Range.getRange().scArch.ancestor('isFormatNode');
    }
    /**
     * Remove the styles of a node or an array of nodes and
     * return the nodes that were effectively unstyled.
     *
     * @private
     * @param {ArchNode|ArchNode []} node
     * @returns {ArchNode []}
     */
    _unstyle (node) {
        var nodes = Array.isArray(node) ? node : [node];
        return nodes.filter(function (node) {
            if (node.style && node.style.length) {
                node.style.clear();
                return true;
            }
        });
    }
}

we3.addPlugin('FontStyle', FontStylePlugin);

})();
