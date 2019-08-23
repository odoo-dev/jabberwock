(function () {
'use strict';

class ImageUrlPlugin extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Media', 'Image'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Media'];
        this.templatesDependencies = ['src/xml/media.xml'];
    }
    start () {
        var title = this.options.translate('ImageUrl', 'Image');
        this.dependencies.Media.addPanel('image', title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 10);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    createForm () {
        return this._renderTemplate('we3.modal.media.image');
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _renderMediaTab (mediaArchNode) {
        return {
            active: mediaArchNode && mediaArchNode.isImg && mediaArchNode.isImg(),
            content: this.createForm(),
        };
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onSaveMedia (panel) {
        debugger
    }
    _onURLInputChange (value, ev) {
        var form = ev.target.closest('form');
        this._updateURLInputbuttons(form);
    }
    _onURLButtonClick (value, ev) {
        var form = ev.target.closest('form');
        var input = ev.target.previousElementSibling;
        var ext = input.value.split('.').pop();
        var records = [{
            alt: input.value,
            url: input.value,
            selected: true,
            mimetype: 'application/' + ext,
        }];
        input.value = '';
        this._updateURLInputbuttons(form);
        this._addDocuments(form, records);
    }
}

we3.addPlugin('ImageUrl', ImageUrlPlugin);

})();
