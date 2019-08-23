(function () {
'use strict';

var customArchNodes = we3.customArchNodes = {
    ArchNode: we3.ArchNode,
    FRAGMENT: we3.ArchNodeFragment,
    TEXT: we3.ArchNodeText,
    'TEXT-VIRTUAL': we3.ArchNodeVirtualText,
    br: we3.ArchNodeBr,
};

we3.addArchNode = function (nodeName, ArchNode) {
    customArchNodes[nodeName] = ArchNode;
};
we3.getArchNode = function (nodeName) {
    return customArchNodes[nodeName];
};


})();