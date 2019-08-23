(function () {
'use strict';

//--------------------------------------------------------------------------
// Alt update description
//--------------------------------------------------------------------------

class AltPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['src/xml/media.xml'];
        this.dependencies = ['Arch', 'Modal'];
        this.buttons = {
            template: 'we3.buttons.image.alt',
            enabled: '_enabled',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    alt (value, archNode) {
        var fragment = this._renderTemplate('we3.modal.media.alt', {
            archNode: archNode,
        });

        var title = this.options.translate('Media', 'Change media description and tooltip');
        var buttons = [{
            text: this.options.translate('Media', 'Save'),
            click: this._onClickSave.bind(this, archNode),
            className: 'we3-primary',
        }, {
            text: this.options.translate('Media', 'Discard'),
        }];
        this._modalId = this.dependencies.Modal.add(this.pluginName, title, fragment, buttons, function onClose() {
            self._modalId = null;
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _enabled (buttonName, focusNode) {
        return focusNode.isImg && focusNode.isImg();
    }

    _onClickSave (archNode) {
        var modal = this.dependencies.Modal.get(this._modalId);
        archNode.attributes.alt = modal.querySelector('input#alt').value;
        archNode.attributes.title = modal.querySelector('input#title').value;
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }
}

we3.addPlugin('Alt', AltPlugin);

})();
