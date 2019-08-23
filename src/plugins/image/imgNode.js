(function () {
'use strict';

class ImgNode extends we3.AbstractMediaNode {
    isImg () {
        return true;
    }
    isInline () {
        return true;
    }
    get type () {
        return 'img';
    }
}

we3.addArchNode('img', ImgNode);

})();
