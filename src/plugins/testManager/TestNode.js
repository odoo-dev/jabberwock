(function () {
'use strict';

const regex = we3.utils.regex.TestManagerPlugin;

class TestNode extends  we3.ArchNodeVirtualText {
    //--------------------------------------------------------------------------
    // static
    //--------------------------------------------------------------------------

    static parse (archNode) {
        if (TestNode._isTestingVirtualNode(archNode)) {
            return TestNode._createTestingVirtualNode(archNode);
        }
    }
    static _createTestingVirtualNode (archNode) {
        if (archNode.type === 'TEST') {
            return;
        }
        var matches = archNode.nodeValue.match(regex.rangeCollapsed) || archNode.nodeValue.match(regex.rangeNotCollapsed);
        if (matches) {
            var fragment = new we3.ArchNodeFragment(archNode.params);
            matches.shift();
            matches.forEach(function (match) {
                if (match === regex.rangeCollapsed) {
                    fragment.append(new TestNode(archNode.params, null, null, regex.rangeStart));
                    fragment.append(new TestNode(archNode.params, null, null, regex.rangeEnd));
                } else if (match && match.length) {
                    if (match === regex.rangeStart || match === regex.rangeEnd) {
                        fragment.append(new TestNode(archNode.params, null, null, match));
                    } else {
                        fragment.append(new we3.ArchNodeText(archNode.params, null, null, match));
                    }
                }
            });
            return fragment;
        }
    }
    static _isTestingVirtualNode (archNode) {
        return archNode.nodeValue && regex.range.test(archNode.nodeValue);
    }

    //--------------------------------------------------------------------------
    // public
    //--------------------------------------------------------------------------

    constructor (params, nodeName, attributes, nodeValue) {
        super(...arguments)
        this.nodeValue = nodeValue;
    }
    isVisibleText () {
        return true;
    }
    isTestNode () {
        return true;
    }
    toString (options) {
        return this.nodeValue;
    }
    get type () {
        return 'TEST';
    }

    //--------------------------------------------------------------------------
    // private
    //--------------------------------------------------------------------------

    _applyRulesArchNode () {}
}

we3.TestNode = TestNode;
we3.addArchNode('TEST', TestNode);

})();
