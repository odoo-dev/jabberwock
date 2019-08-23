(function () {
'use strict';

class TestContainerNode extends we3.ArchNode {
    //--------------------------------------------------------------------------
    // public
    //--------------------------------------------------------------------------

    isBlock () {
        return true;
    }
    isContentEditable () {
        return true;
    }
    isEditable () {
        return true;
    }
    isRoot () {
        return true;
    }
    isTestNode () {
        return true;
    }
    isUnbreakable () {
        return true;
    }
    split (offset) {
        var virtualText = this.params.create();
        this.childNodes[offset].after(virtualText);
        return virtualText;
    }
    get type () {
        return 'TEST_CONTAINER';
    }

    //--------------------------------------------------------------------------
    // private
    //--------------------------------------------------------------------------

    _applyRulesArchNode () {}
}

we3.TestContainerNode = TestContainerNode;
we3.addArchNode('TEST_CONTAINER', TestContainerNode);

})();
