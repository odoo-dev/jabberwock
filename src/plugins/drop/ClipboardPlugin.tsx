(function () {
'use strict';

class ClipboardPlugin extends we3.AbstractPlugin {
    static get autoInstall () {
        return [];
    }

    constructor () {
        super(...arguments);
        this.dependencies = ['Arch'];
        this.editableDomEvents = {
            'paste': '_onPaste',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Prepare clipboard data for safe pasting into the editor.
     * Escape tags
     *
     * @param {String} clipboardData
     * @returns {DOM-fragment}
     */
    prepareTextClipboardData (clipboardData) {
        var isXML = !!clipboardData.match(/<[a-z]+[a-z0-9-]*( [^>]*)*>[\s\S\n\r]*<\/[a-z]+[a-z0-9-]*>/i);
        var isJS = !isXML && !!clipboardData.match(/\(\);|this\.|self\.|function\s?\(|super\.|[a-z0-9]\.[a-z].*;/i);

        var fragment = document.createDocumentFragment();
        var pre = document.createElement('pre');
        pre.innerHTML = clipboardData.trim()
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            // get that text as an array of text nodes separated by <br> where needed
            .replace(/(\n+)/g, '<br>');

        if (isJS || isXML) {
            fragment.appendChild(pre);
        } else {
            [].slice.call(pre.childNodes).forEach(function (node) {
                fragment.appendChild(node);
            });
        }
        return fragment;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Handle paste events to permit cleaning/sorting of the data before pasting.
     *
     * @private
     * @param {DOMEvent} e
     */
    _onPaste (e) {
        e.preventDefault();
        var clipboardData = e.clipboardData.getData('text/plain');
        var fragment = this.prepareTextClipboardData(clipboardData);
        this.dependencies.Arch.insert(fragment);
    }
}

we3.addPlugin('Clipboard', ClipboardPlugin);

})();
