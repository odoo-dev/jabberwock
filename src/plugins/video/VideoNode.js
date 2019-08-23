(function () {
'use strict';

class VideoNode extends we3.AbstractMediaNode {
    //--------------------------------------------------------------------------
    // static
    //--------------------------------------------------------------------------

    static parse (archNode, options) {
        var isVideo = archNode.nodeName === 'div' && (archNode.className.contains('media_iframe_video'));
        if (isVideo) {
            return new VideoNode(archNode.params, archNode.nodeName, archNode.attributes);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    isBlock () {
        return true;
    }
    isVideo () {
        return true;
    }
    get type () {
        return 'VIDEO';
    }
}

we3.addArchNode('VIDEO', VideoNode);

})();
