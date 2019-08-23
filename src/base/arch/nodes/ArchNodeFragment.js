(function () {
'use strict';

we3.ArchNodeFragment = class extends we3.ArchNode {
    get type () {
        return 'FRAGMENT';
    }

    /**
     * @override
     */
    applyRules () {
        this._applyRulesPropagation();
    }
    /**
     * @override
     */
    isEditable () {
        return true;
    }
    /**
     * @override
     */
    isElement () {
        return false;
    }
    /**
     * @override
     */
    isFragment () {
        return true;
    }
    /**
     * @override
     */
    isVirtual () {
        return true;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _triggerChange () {}
};

})();
