(function () {
'use strict';

class FullScreenPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_fullscreen.xml'];
        this.className = 'fullscreen';
        this.buttons = {
            template: 'wysiwyg.buttons.fullscreen',
            active: '_active',
            enabled: '_enabled',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    toggle () {
        this.editor.classList.toggle(this.className);
        return this._active() ? this._deactivate() : this._activate();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Activate fullscreen
     */
    _activate () {
        this._resize(this.window.innerHeight);
        this.editor.style.height = this.window.innerHeight + 'px';
        this.isActive = true;
    }
    /**
     * @param {String} buttonName
     * @param {Node} focusNode
     * @returns {Boolean} true if the given button should be active
     */
    _active (buttonName, focusNode) {
        return this.isActive;
    }
    /**
     * Deactivate fullscreen
     */
    _deactivate () {
        this.editor.style.height = '';
        this.isActive = false;
    }
    /**
     * @param {String} buttonName
     * @param {Node} focusNode
     * @returns {Boolean} true if the given button should be enabled
     */
    _enabled (buttonName, focusNode) {
        return true;
    }
    /**
     * Resize the editor to the given size in px or reset the size if none given.
     *
     * @private
     * @param {Number|String} [size]
     */
    _resize (size) {
        this.editor.style.height = size ? size + 'px' : '';
    }
}

we3.addPlugin('FullScreen', FullScreenPlugin);

})();
