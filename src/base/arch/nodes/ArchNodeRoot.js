(function () {
'use strict';

we3.ArchNodeRoot = class extends we3.ArchNode {
    get type () {
        return 'EDITABLE';
    }

    /**
     * @override
     */
    index () {
        return null;
    }
    /**
     * @override
     */
    isEditable () {
        return this.isContentEditable(this) !== false;
    }
    /**
     * @override
     */
    isElement () { return false; }
    /**
     * @override
     */
    isRoot () { return true; }
    /**
     * @override
     */
    isUnbreakable () {
        return true;
    }
    /**
     * @override
     */
    isVirtual () { return true; }
    /**
     * @override
     */
    remove () {
        console.warn("Cannot remove the root");
    }
    /**
     * @override
     */
    repr (noArchitectural) {
        var value = this.toString({
            showIDs: true,
            keepVirtual: true,
            architecturalSpace: !noArchitectural,
        }).trim();
        return value;
    }
    /**
     * @override
     */
    split (offset) {
        var virtualText = this.params.create();
        this.childNodes[offset].after(virtualText);
        return virtualText;
    }
};

})();
