(function () {
'use strict';

class ModalPlugin extends we3.AbstractPlugin {
    /**
     * @override
     */
    constructor (parent, params) {
        super(...arguments);
        this.templatesDependencies = ['src/xml/modal.xml'];
        this._modals = document.createElement('we3-modals');
        this._backdrop = document.createElement('we3-modal-backdrop');
        this._modals.appendChild(this._backdrop);
        params.insertAfterMainRow(this._modals);
        this._index = 0;
        this._modalList = [];
        this._modalListCallback = [];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     *
     * @param {string} pluginName
     * @param {string} title
     * @param {string|DocumentFragment} content
     * @param {object[]} buttons
     * @param {string}     buttons[].text
     * @param {function}   [buttons[].click]
     * @param {boolean}    [buttons[].close] default: true
     * @param {string}     [buttons[].classes]
     * @param {function} onClose
     **/
    add (pluginName, title, content, buttons, onClose) {
        var modal = document.createElement('we3-modal');
        modal.innerHTML = this.options.renderTemplate('Modal', 'we3.modal', {
            plugin: this,
            options: this.options,
        });
        modal.setAttribute('data-plugin', pluginName);

        modal.querySelector('we3-title').textContent = title;

        this._modalContent(modal, content);
        this._modalButtons(modal, buttons);
        this._modals.appendChild(modal);
        this._toggleBackdrop();

        this._modalList[++this._index] = modal;
        this._modalListCallback[this._index] = onClose;
        return this._index;
    }
    get (index) {
        return this._modalList[index];
    }
    remove (index) {
        var modal = this._modalList[index];
        var onClose = this._modalListCallback[index];
        delete this._modalList[index];
        delete this._modalListCallback[index];
        modal.parentNode.removeChild(modal);
        this._toggleBackdrop();
        if (onClose) {
            onClose();
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _modalContent (modal, content) {
        var body = modal.querySelector('we3-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
    }
    _modalButtons (modal, buttons) {
        var self = this;
        var close = modal.querySelector('we3-modal-close');
        close.addEventListener('click', this._onClickCloseModal.bind(this), false);

        var footer = modal.querySelector('we3-footer');
        buttons.forEach(function (btn) {
            var button = document.createElement('we3-button');
            button.textContent = btn.text;
            button.className = btn.className || '';
            if (btn.click) {
                button.addEventListener('click', btn.click, false);
            }
            if (btn.close !== false) {
                button.addEventListener('click', self._onClickCloseModal.bind(self), false);
            }
            footer.appendChild(button);
        });
    }
    _toggleBackdrop () {
        this._backdrop.className = this._modals.childNodes.length > 1 ? 'show' : '';
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onClickCloseModal (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var node = ev.target;
        while (node.tagName !== 'WE3-MODAL') {
            node = node.parentNode;
        }
        var index = this._modalList.indexOf(node);
        if (index === -1) {
            return;
        }
        this.remove(index);
    }
}

we3.addPlugin('Modal', ModalPlugin);

})();
