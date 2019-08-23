(function () {
'use strict';

var TestUI = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'Toolbar'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test', 'Toolbar'];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    async test (assert) {
        await this._testEnabledToolbar(assert);
    }

    async _testEnabledToolbar (assert) {
        var self = this;
        var Test = self.dependencies.Test;
        var input = document.createElement('input');
        this.editor.parentNode.insertBefore(input, this.editor);

        await Test.triggerNativeEvents(this.editable, ['mousedown', 'focus', 'click', 'mouseup']);
        await new Promise(setTimeout);
        assert.ok(!!this.editor.querySelector('we3-toolbar we3-group we3-button:not(.disabled)'), "Should enable the toolbar on blur the editor");
        await new Promise(setTimeout);
        await Test.triggerNativeEvents(input, ['mousedown', 'focus', 'click', 'mouseup']);
        await new Promise(setTimeout);
        assert.notOk(!!this.editor.querySelector('we3-toolbar we3-group we3-button:not(.disabled)'), "Should disabled the toolbar on blur the editor");
        await new Promise(setTimeout);
        await Test.triggerNativeEvents(this.editable, ['mousedown', 'focus', 'click', 'mouseup']);
        await new Promise(setTimeout);
        assert.ok(!!this.editor.querySelector('we3-toolbar we3-group we3-button:not(.disabled)'), "Should enable the toolbar on blur the editor");

        this.editor.parentNode.removeChild(input);
    }
};

we3.addPlugin('TestUI', TestUI);

})();
