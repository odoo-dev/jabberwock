(function () {
'use strict';



var Rules = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseRules'];
    }
    /**
     * Add a method to the list to check if an ArchNode is editable.
     *
     * @see BaseRules.isEditable
     * @param {function(ArchNode)} fn
     */
    addEditableNodeCheck (fn) {
        this.dependencies.BaseRules.addEditableNodeCheck(fn);
    }
    /**
     * Add a list of ordering rules.
     *
     * @param {{} []} list
     */
    addOrderedList (list) {
        this.dependencies.BaseRules.addOrderedList(list);
    }
    /**
     * Add a parser rule.
     *
     * @param {function (ArchNode, [Object])} callback
     */
    addParserRule (callback) {
        this.dependencies.BaseRules.addParserRule(callback);
    }
    /**
     * Add a structure rule.
     *
     * @param {Object} rule
     */
    addStructureRule (rule) {
        this.dependencies.BaseRules.addStructureRule(rule);
    }
    /**
     * Add a method to the list to check if an ArchNode is unbreakable.
     *
     * @see BaseRules.isUnbreakable
     * @param {function(ArchNode)} fn
     */
    addUnbreakableNodeCheck (fn) {
        this.dependencies.BaseRules.addUnbreakableNodeCheck(fn);
    }
    /**
     * Add a method to the list to check if an ArchNode is a voidoid.
     *
     * @see BaseRules.isVoidoid
     * @param {Function (ArchNode)} fn
     */
    addVoidoidCheck (fn) {
        this.dependencies.BaseRules.addVoidoidCheck(fn);
    }
};

we3.pluginsRegistry.Rules = Rules;

})();
