(function () {
'use strict';

const UploadDocumentPlugin = we3.getPlugin('UploadDocument');

class UploadImagePlugin extends UploadDocumentPlugin {
    static get autoInstall () {
        return ['Media', 'Upload', 'Image'];
    }
    /**
     * @override
     */
    constructor () {
        super(...arguments);
        this.dependencies = ['Media', 'Image', 'Upload'];
        this._dep = 'Image';
        this._accept = 'image/*';
        this._multi = false;
        this._inputs = [{
            type: 'hidden',
            name: 'disable_optimization',
        }];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    uploadWithoutOptimization (ev) {
        var input = ev.target.closest("form").querySelector('input[name="disable_optimization"]');
        input.setAttribute('value', '1');
        input.value = '1';
        this.dependencies.Upload.upload();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addPanel () {
        var title = this.options.translate(this.pluginName, 'Image');
        this.dependencies.Media.addPanel('upload-image', title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 10);
    }
}

we3.addPlugin('UploadImage', UploadImagePlugin);

})();
