(function () {
'use strict';

var TestKeyboardArrow = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['TestKeyboard'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test', 'TestKeyboard'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.keyboardTests = [
            {
                name: "LEFT collapse selection",
                content: "<p>dom▶ to◀ edit</p>",
                steps: [{
                    key: 'LEFT',
                }],
                test: "<p>dom◆ to edit</p>",
            },
            {
                name: "RIGHT collapse selection",
                content: "<p>dom▶ to◀ edit</p>",
                steps: [{
                    key: 'RIGHT',
                }],
                test: "<p>dom to◆ edit</p>",
            },
            {
                name: "RIGHT at end",
                content: "<p>dom to edit◆</p>",
                steps: [{
                    key: 'RIGHT',
                }],
                test: "<p>dom to edit◆</p>",
            },
            {
                name: "LEFT with on virtual text node",
                content: "<p>dom t\uFEFF◆o edit</p>",
                steps: [{
                    key: 'LEFT',
                }],
                test: "<p>dom ◆to edit</p>",
            },
            {
                name: "2 x LEFT with on virtual text node",
                content: "<p>dom t\uFEFFo◆ edit</p>",
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'LEFT',
                }],
                test: "<p>dom ◆to edit</p>",
            },
            {
                name: "2 x LEFT with 3 virtual text node",
                content: "<p>dom t\uFEFF\uFEFF\uFEFFo◆ edit</p>",
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'LEFT',
                }],
                test: "<p>dom ◆to edit</p>",
            },
            {
                name: "RIGHT with on virtual text node",
                content: "<p>dom t◆\uFEFFo edit</p>",
                steps: [{
                    key: 'RIGHT',
                }],
                test: "<p>dom to◆ edit</p>",
            },
            {
                name: "2 x RIGHT with on virtual text node",
                content: "<p>dom ◆t\uFEFFo edit</p>",
                steps: [{
                    key: 'RIGHT',
                }, {
                    key: 'RIGHT',
                }],
                test: "<p>dom to◆ edit</p>",
            },
            {
                name: "2 x RIGHT with 3 virtual text node",
                content: "<p>dom ◆t\uFEFF\uFEFF\uFEFFo edit</p>",
                steps: [{
                    key: 'RIGHT',
                }, {
                    key: 'RIGHT',
                }],
                test: "<p>dom to◆ edit</p>",
            },
            {
                name: "LEFT move before voidoid",
                content: '<p>dom to ▶<img src="/web_editor/static/src/img/transparent.png"/>◀ edit</p>',
                steps: [{
                    key: 'LEFT',
                }],
                test: '<p>dom to ◆<img src="/web_editor/static/src/img/transparent.png"/> edit</p>',
            },
            {
                name: "RIGHT move after voidoid",
                content: '<p>dom to ▶<img src="/web_editor/static/src/img/transparent.png"/>◀ edit</p>',
                steps: [{
                    key: 'RIGHT',
                }],
                test: '<p>dom to <img src="/web_editor/static/src/img/transparent.png"/>◆ edit</p>',
            },
            {
                name: "LEFT before image in image in table",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "LEFT before image in table without spaces",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "LEFT before image in table without spaces (2)",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
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

we3.addPlugin('TestKeyboardArrow', TestKeyboardArrow);

})();
