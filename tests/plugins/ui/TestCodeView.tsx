(function () {
'use strict';

var TestCodeView = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'CodeView'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Test'];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async test (assert) {
        var tests = Object.getOwnPropertyNames(TestCodeView.prototype).filter(function (name) {
            return !name.indexOf('_test');
        });
        for (var k = 0; k < tests.length; k++) {
            var name = tests[k];
            assert.ok(true, "test: " + name);
            await this[name](assert);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    async _testBasicCodeView (assert) {
        var btnCodeView = document.querySelector('we3-editor we3-button[data-plugin="CodeView"]');
        this.dependencies.Arch.setValue('<p>aaa</p>');
        await this.dependencies.Test.triggerNativeEvents(this.editable.firstChild, ['mousedown', 'click', 'mouseup']);
        await this.dependencies.Test.triggerNativeEvents(btnCodeView, ['mousedown', 'click', 'mouseup']);
        var textarea = this.editor.querySelector('textarea[name="codeview"]');
        await this.dependencies.Test.triggerNativeEvents(textarea, ['mousedown', 'click', 'mouseup']);
        this.document.execCommand("insertText", 0, 'bbb');
        assert.strictEqual(textarea.value, 'bbb<p>aaa</p>', "Should change the texarea value");
        await this.dependencies.Test.triggerNativeEvents(btnCodeView, ['mousedown', 'click', 'mouseup']);
        assert.strictEqual(this.dependencies.Arch.getValue(), '<p>bbb</p><p>aaa</p>', "Should change the wysiwyg editable value");
    }
};

we3.addPlugin('TestCodeView', TestCodeView);

})();
