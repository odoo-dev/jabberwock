(function () {
'use strict';

class CodeViewPlugin extends we3.AbstractPlugin {
    /**
     * @override
     */
    constructor (parent, params) {
        super(...arguments);

        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_codeview.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.codeview',
            active: '_isActive',
            enabled: '_enabled',
        };

        this.getValueOptions = {
            keepVirtual: true,
            architecturalSpace: true,
        };
        this.codeview = this._createCodable();
        params.insertAfterMainRow(this.codeview);
    }
    /**
     * @override
     */
    start () {
        this._deactivate();
        return super.start();
    }
    /**
     * @override
     */
    destroy () {
        this.isBeingDestroyed = true;
        super.destroy();
    }
    /**
     * @override
     */
    getEditorValue () {
        if (this._isActive()) {
            this.triggerUp('set_value', {
                value: this.codeview.value.trim(),
            });
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Activate the codeview with the given value.
     *
     * @param {String} value
     * @param {Object} [options]
     */
    active (value, options) {
        var self = this;
        options = Object.assign({}, this.getValueOptions, options);
        if (this._isActive()) {
            return;
        }
        if (value) {
            this._setCodeViewValue(value);
        } else {
            this.triggerUp('get_value', {
                options: options,
                callback (value) {
                    self._setCodeViewValue(value);
                },
            });
        }
        this._activate();
    }
    /**
     * Return to the wysiwyg view and set its value
     * to `value` or the codeview's value.
     *
     * @param {String} [value]
     */
    deactivate (value) {
        if (this._isActive()) {
            this._deactivate();
            this.triggerUp('set_value', {
                value: value || this.codeview.value.trim(),
            });
        }
    }
    /**
     * Toggle the code view.
     */
    toggle () {
        if (this._isActive()) {
            this.deactivate();
        } else {
            this.active(null);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Activate the code view and deactivate the wysiwyg view.
     *
     * @private
     */
    _activate () {
        this.isActive = true;
        this.codeview.style.display = '';
        this.editable.style.display = 'none';
        this.trigger('active');
        setTimeout(this._focus.bind(this));
    }
    /**
     * Blur the code view and focus the wysiwyg view.
     *
     * @private
     */
    _blur() {
        this.codeview.blur();
        this.editable.focus();
    }
    /**
     * Create the codable view.
     *
     * @private
     * @returns {Node}
     */
    _createCodable () {
        var codeview = document.createElement('textarea');
        codeview.name = 'codeview';
        codeview.style.display = 'none';
        return codeview;
    }
    /**
     * Deactivate the code view and activate the wysiwyg view.
     *
     * @private
     */
    _deactivate () {
        this.isActive = false;
        this.codeview.style.display = 'none';
        this.editable.style.display = '';
        this._blur();
        this.trigger('deactivate');
    }
    /**
     * Return true if the codeview is active.
     *
     * @private
     * @returns {Boolean}
     */
    _enabled () {
        return true;
    }
    /**
     * Focus the code view and blur the wysiwyg view.
     *
     * @private
     */
    _focus () {
        this.editable.blur();
        this.codeview.selectionStart = 0;
        this.codeview.selectionEnd = 0;
        this.codeview.focus();
    }
    /**
     * Return true if the codeview is active.
     *
     * @private
     * @returns {Boolean}
     */
    _isActive () {
        return this.isActive;
    }
    /**
     * Set the value of the code view.
     *
     * @private
     * @param {String} value
     */
    _setCodeViewValue (value) {
        this.codeview.value = value.trim();
    }
}

we3.addPlugin('CodeView', CodeViewPlugin);

})();
