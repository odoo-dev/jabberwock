(function () {
'use strict';

var TestToolbarKeymap = class extends we3.AbstractPlugin {
    static get autoInstall() {
        return ['Test', 'TestToolbar', 'Keymap'];
    }
    constructor() {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.toolbarTests = [
            {
                name: "Click KEYMAP",
                content: '<p>d◆om to edit</p>',
                do: async function (assert) {
                    var wysiwyg = document.getElementsByTagName('we3-editor')[0];
                    var btnKeymap = wysiwyg.querySelector('we3-toolbar we3-button[name="help-show"]');
                    await self.dependencies.Test.triggerNativeEvents(btnKeymap, ['mousedown', 'click']);

                    var modal = wysiwyg.querySelector('we3-modal[data-plugin="KeyMap"]');
                    assert.ok(modal, 1, 'should display the keymap modal');
                    assert.strictEqual(modal.querySelector('we3-title').textContent, 'Help', 'modal should have Help title');

                    var shortcut = modal.querySelector('.help-list-item:first-child');
                    assert.ok(shortcut, 'modal should display keyboard shortcuts');

                    assert.ok(shortcut.querySelector('label kbd'), 'shortcuts should display as keyboard keys');
                    assert.ok(shortcut.querySelector('.help-description'), 'shortcuts should have a description');

                    assert.notOk(modal.querySelector('we3-footer').childNodes.length, 'modal should not have buttons');

                    await self.dependencies.Test.triggerNativeEvents(modal.querySelector('we3-modal-close'), ['mousedown', 'click']);
                    assert.notOk(wysiwyg.querySelector('we3-modal[data-plugin="KeyMap"]'), 'should have closed the modal');
                },
                test: '<p>d◆om to edit</p>',
            },
        ];
    }

    start() {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test(assert) {
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarKeymap', TestToolbarKeymap);

})();
