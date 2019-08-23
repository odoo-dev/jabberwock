(function () {
'use strict';

var TestKeyboardTab = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['TestKeyboard'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test', 'TestKeyboard'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.keyboardTests = [{
                name: "in li: TAB at start",
                content: "<ul><li>◆dom to edit</li></ul>",
                steps: [{
                    key: 'TAB',
                }],
                test: '<ul><li class="o_indent"><ul><li>◆dom to edit</li></ul></li></ul>',
            },
            {
                name: "in indented-li: SHIFT+TAB at start",
                content: "<ul><li><ul><li>◆dom to edit</li></ul></li></ul>",
                steps: [{
                    key: 'TAB',
                    shiftKey: true,
                }],
                test: "<ul><li>◆dom to edit</li></ul>",
            },
            {
                name: "in indented-li: SHIFT+TAB within text",
                content: "<ul><li><ul><li>dom t◆o edit</li></ul></li></ul>",
                steps: [{
                    key: 'TAB',
                    shiftKey: true,
                }],
                test: "<ul><li>dom t◆o edit</li></ul>",
            },
            {
                name: "in li: TAB within contents",
                content: "<ul><li>dom t◆o edit</li></ul>",
                steps: [{
                    key: 'TAB',
                }],
                test: "<ul><li>dom t &nbsp; &nbsp;◆o edit</li></ul>",
            },
            {
                name: "in li: SHIFT+TAB within contents (should remove list)",
                content: "<ul><li>dom t◆o edit</li></ul>",
                steps: [{
                    key: 'TAB',
                    shiftKey: true,
                }],
                test: "<p>dom t◆o edit</p>",
            },
            {
                name: "in td > p: TAB within contents",
                content: "<table><tbody><tr><td><p>dom t◆o edit</p></td><td><p>node</p></td></tr></tbody></table>",
                steps: [{
                    key: 'TAB',
                }],
                test: "<table><tbody><tr><td><p>dom to edit</p></td><td><p>◆node</p></td></tr></tbody></table>",
            },
            {
                name: "in p: TAB at start",
                content: "<p>◆dom to edit</p>",
                steps: [{
                    key: 'TAB',
                }],
                test: '<p style="margin-left:1.5em">◆dom to edit</p>',
            },
            {
                name: "in indented-p: SHIFT+TAB at start",
                content: '<p style="margin-left: 1.5em;">◆dom to edit</p>',
                steps: [{
                    key: 'TAB',
                    shiftKey: true,
                }],
                test: "<p>◆dom to edit</p>",
            },
            {
                name: "in indented-p: SHIFT+TAB within text",
                content: '<p style="margin-left: 1.5em;">dom t◆o edit</p>',
                steps: [{
                    key: 'TAB',
                    shiftKey: true,
                }],
                test: "<p>dom t◆o edit</p>",
            },
            {
                name: "in p: TAB -> BACKSPACE at start",
                content: "<p>◆dom to edit</p>",
                steps: [{
                    key: 'TAB',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>◆dom to edit</p>",
            },
            {
                name: "in p > b: TAB at start",
                content: "<p>dom <b>◆to edit</b></p>",
                steps: [{
                    key: 'TAB',
                }],
                test: "<p>dom <b>&nbsp; &nbsp; ◆to edit</b></p>",
            },
            {
                name: "in p > b: TAB -> BACKSPACE at start",
                content: "<p>dom <b>◆to edit</b></p>",
                steps: [{
                    key: 'TAB',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>dom <b>&nbsp; &nbsp;◆to edit</b></p>",
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

we3.addPlugin('TestKeyboardTab', TestKeyboardTab);

})();
