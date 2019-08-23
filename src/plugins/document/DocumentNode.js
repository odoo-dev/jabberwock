(function () {
'use strict';

class DocumentNode extends we3.AbstractMediaNode {
    //--------------------------------------------------------------------------
    // static
    //--------------------------------------------------------------------------

    static parse (archNode, options) {
        var isDocument = archNode.nodeName === 'a' && (archNode.className.contains('we3-document') || archNode.attributes['data-mimetype']);
        if (isDocument) {
            return new DocumentNode(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    isDocument () {
        return true;
    }
    isInline () {
        return true;
    }
    get type () {
        return 'DOCUMENT';
    }
}

we3.addArchNode('DOCUMENT', DocumentNode);

})();
