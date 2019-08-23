(function () {
'use strict';

var TestRenderer = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Renderer', 'FontStyle', 'TestKeyboard'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestKeyboard'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.keyboardTests = [
            {
                name: "no changes",
                content: "<p><b>dom to edit◆</b></p>",
                steps: [],
                test: "<p><b>dom to edit◆</b></p>",
                testDOM: "<p><b>dom to edit</b></p>",
            },
            {
                name: "ENTER at the end of b in p",
                content: "<p><b>dom to edit◆</b></p>",
                steps: [{
                    key: 'Enter',
                }],
                test: "<p><b>dom to edit</b></p><p>▶<br/>◀</p>",
                testDOM: "<p><b>dom to edit</b></p><p><br></p>",
            },
            {
                name: "ENTER after click bold, at the end of b in p",
                content: "<p>▶dom to edit◀</p><p>other content</p>",
                steps: [{
                    do:  async function () {
                        var p = self.editable.querySelector('test-container p');
                        var bold = self.editor.querySelector('we3-button[data-method="formatText"][data-value="b"]');
                        await self.dependencies.Test.triggerNativeEvents(bold, ['mousedown', 'click', 'mouseup']);
                        await self.dependencies.Test.setRangeFromDOM(p.lastChild, 1);
                    }
                }, {
                    key: 'Enter',
                }],
                test: '<p><b>dom to edit</b></p><p>▶<br/>◀</p><p>other content</p>',
                testDOM: '<p><b>dom to edit</b></p><p><br></p><p>other content</p>',
            },
        ];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        return this.dependencies.TestKeyboard.test(assert, this.keyboardTests);
    }
};

we3.addPlugin('TestRenderer', TestRenderer);

})();
