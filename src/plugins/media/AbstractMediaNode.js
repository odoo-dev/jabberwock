(function () {
'use strict';

class AbstractMediaNode extends we3.ArchNode {
    isVoidoid () {
        return true;
    }
    isMedia () {
        return true;
    }
    removeLeft () {
        this.remove();
    }
    removeRight () {
        this.remove();
    }
    split () {
        return;
    }
}

we3.AbstractMediaNode = AbstractMediaNode;

})();
