(function () {
'use strict';

class IndentPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Range'];
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_indent.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.indent',
            active: '_active',
        };
        this.editableDomEvents = {
            'keydown': '_onKeyDown',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Indent
     */
    indent () {
        var rangeToPreserve = this.dependencies.Range.getRange();
        this.dependencies.Arch.indent();
        this.dependencies.Range.setRange(rangeToPreserve);
    }
    /**
     * Outdent the list
     */
    outdent () {
        var rangeToPreserve = this.dependencies.Range.getRange();
        this.dependencies.Arch.outdent();
        this.dependencies.Range.setRange(rangeToPreserve);
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
        if (!range.isCollapsed()) {
            return;
        }
        switch (e.key) {
            case 'Backspace':
                if (range.so === 0 && range.scArch.isLeftEdgeOfPred(node => node.isIndented())) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.outdent();
                }
                break;
            case 'Tab':
                if (e.shiftKey && range.scArch.ancestor('isIndented')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.outdent();
                }
                if (!e.shiftKey && !range.so && range.scArch.isLeftEdgeOfBlock()) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.indent();
                }
                break;
        }
    }
}

we3.addPlugin('Indent', IndentPlugin);

})();
