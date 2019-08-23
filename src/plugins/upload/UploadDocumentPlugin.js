(function () {
'use strict';

class UploadDocumentPlugin extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Media', 'Upload', 'Document'];
    }
    /**
     * @override
     */
    constructor () {
        super(...arguments);
        this.dependencies = ['Media', 'Document', 'Upload'];
        this._dep = 'Document';
        this._accept = '*/*';
        this._multi = false;
        this._inputs = [];
    }
    /**
     * @override
     */
    start () {
        this._addPanel();
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addPanel () {
        var title = this.options.translate(this.pluginName, 'Document');
        this.dependencies.Media.addPanel('upload-document' ,title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 20);
    }
    _displayRecord (record) {
        return this.dependencies[this._dep].displayRecord(record);
    }
    _renderMediaTab (mediaArchNode) {
        var fragment = this.dependencies.Upload.createUploadForm(this.pluginName, {
            displayRecord: this._displayRecord.bind(this),
            updateSelection: this._onUpdateSelection.bind(this),
            accept: this._accept,
            multi: this._multi,
            inputs: this._inputs,
        });
        return {
            active: mediaArchNode && !!this.dependencies[this._dep].getArchNode(mediaArchNode),
            content: fragment,
        };
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onSaveMedia () {
        var self = this;
        var promises = [];
        var elements = this._selected.map(this._displayRecord.bind(this));
        if (self.options.upload.onSelect) {
            promises = elements.map(function (el, index) {
                return self.options.upload.onSelect(self.pluginName, self._selected[index], el).then(function (el) {
                    elements[index] = el;
                });
            });
        }
        return Promise.all(promises).then(function () {
            return self._multi ? elements : elements[0];
        });
    }
    _onUpdateSelection (records) {
        this._selected = records;
    }
}

we3.addPlugin('UploadDocument', UploadDocumentPlugin);

})();

