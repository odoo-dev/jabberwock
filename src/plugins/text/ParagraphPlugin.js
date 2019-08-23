(function () {
'use strict';

class ParagraphPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Range'];
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_format_text.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.paragraph',
            active: '_active',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the paragraph alignment of a 'format' block.
     *
     * @param {string} align
     *       left, center, right, justify
     */
    align (align) {
        var self = this;
        var rangeToPreserve = this.dependencies.Range.getRange();
        var selection = this.dependencies.Range.getSelectedNodes();
        var changed = selection.map(node => self._alignOne(node, align))
            .filter(item => item);
        var json = changed.filter(node => node).map(node => node.parent.toJSON());
        this.dependencies.Arch.importUpdate(json);
        this.dependencies.Range.setRange(rangeToPreserve);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @param {String} buttonName
     * @param {WrappedRange} range
     * @returns {Boolean} true if the given button should be active
     */
    _active (buttonName, focusNode) {
        var alignName = buttonName.split('-')[1];
        var alignedAncestor = focusNode.isText() ? focusNode.parent : focusNode;
        var cssAlign = alignedAncestor.style.textAlign;
        while (alignedAncestor && !alignedAncestor.isRoot() && !cssAlign) {
            cssAlign = alignedAncestor.style['text-align'];
            alignedAncestor = alignedAncestor.parent;
        }
        if (alignName == 'left' && !cssAlign) {
            return true;
        }
        return alignName === cssAlign;
    }
    /**
     * Align a node if needed. Return the changed node if any.
     *
     * @private
     * @param {ArchNode} node
     * @param {string} align
     *       left, center, right, justify
     * @returns {ArchNode|undefined}
     */
    _alignOne (node, align) {
        if (this._isAlign(node, align)) {
            return;
        }
        var formatNode = node.ancestor('isFormatNode');
        formatNode.style.add('text-align', align);
        if (align === 'left' && this._isAlign(formatNode.parent, align)) {
            // no need for text-align if no parent specifies otherwise
            formatNode.style.remove('text-align');
        }
        return formatNode;
    }
    /**
     * Return true if the node has the given alignment.
     *
     * @private
     * @param {ArchNode} node
     * @param {string} align
     *       left, center, right, justify
     * @returns {boolean}
     */
    _isAlign (node, align) {
        var isAlignMatch = 'is' + align[0].toUpperCase() + align.slice(1, align.length) + 'Align';
        return node[isAlignMatch]();
    }
}

we3.addPlugin('Paragraph', ParagraphPlugin);

})();
