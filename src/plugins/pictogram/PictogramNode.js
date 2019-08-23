(function () {
'use strict';

var utils = we3.utils;

class PictogramNode extends we3.AbstractMediaNode {
    //--------------------------------------------------------------------------
    // static
    //--------------------------------------------------------------------------

    static parse (archNode, options) {
        var iconsParser = options.pictogram || [];
        var isFont = false;
        var className = archNode.isNotText() && archNode.className.toString() || '';
        if (className) {
            iconsParser.forEach(function (picto) {
                var reg = utils.getRegex(picto.parser, 'i', '(^|\\s)(' + picto.parser + ')(\\s|$)');
                if (reg.test(className)) {
                    isFont = true;
                }
            });
        }
        if (isFont) {
            return new PictogramNode(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    isPictogram () {
        return true;
    }
    isInline () {
        return true;
    }
    get type () {
        return 'PICTOGRAM';
    }
}

we3.addArchNode('PICTOGRAM', PictogramNode);

})();
