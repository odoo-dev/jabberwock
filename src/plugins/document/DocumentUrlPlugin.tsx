(function () {
'use strict';

class DocumentUrlPlugin extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Media', 'Document'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Media'];
        this.templatesDependencies = ['src/xml/media.xml'];
    }
    start () {
        var title = this.options.translate('DocumentUrl', 'Document');
        this.dependencies.Media.addPanel('document-url', title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 20);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _renderMediaTab (mediaArchNode) {
        return {
            active: mediaArchNode && mediaArchNode.isImg && mediaArchNode.isImg(),
            content: this._renderTemplate('we3.modal.media.document'),
        };
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onSaveMedia (panel) {
        debugger
    }
}

we3.addPlugin('DocumentUrl', DocumentUrlPlugin);

})();
