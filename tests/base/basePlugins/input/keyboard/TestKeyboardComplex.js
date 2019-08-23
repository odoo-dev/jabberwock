(function () {
'use strict';

var TestKeyboardComplex = class extends we3.AbstractPlugin {
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
                name: "in span > b: SHIFT+ENTER -> BACKSPACE -> 'a'",
                content: "<p><span><b>dom◆ to edit</b></span></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'a',
                }],
                test: "<p><span><b>doma◆ to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER -> ENTER -> BACKSPACE",
                content: "<p><span><b>dom◆ to edit</b></span></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p><span><b>dom<br/>◆&nbsp;to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER -> ENTER -> BACKSPACE -> 'a'",
                content: "<p><span><b>dom◆ to edit</b></span></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'a',
                }],
                test: "<p><span><b>dom<br/>a◆ to edit</b></span></p>",
            },
            {
                name: "in p > b: 2x SHIFT+ENTER -> BACKSPACE",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p><b>dom<br/>◆&nbsp;to edit</b></p>",
            },
            {
                name: "in p > b: 2x ENTER -> 2x BACKSPACE",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: false
                }, {
                    key: 'ENTER',
                    shiftKey: false
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p><b>dom◆ to edit</b></p>",
            },
            {
                name: "in empty-p: 2x ENTER -> 2x BACKSPACE",
                content: "<p><br>◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: false
                }, {
                    key: 'ENTER',
                    shiftKey: false
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>▶<br/>◀</p>",
            },
            {
                name: "in empty-p (p before): ENTER -> 2x BACKSPACE",
                content: "<p>dom not to edit</p><p><br>◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: false
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>dom not to edit◆</p>",
            },
            {
                name: "in p > b: 2x SHIFT+ENTER -> BACKSPACE -> 'a'",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom<br/>a◆ to edit</b></p>",
            },
            {
                name: "in li -> ENTER before br -> 'a'",
                content: "<ul><li><p>dom◆<br/>&nbsp;to edit</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<ul><li><p>dom</p></li><li><p>a◆<br/>&nbsp;to edit</p></li></ul>",
            },
            {
                name: "in li -> ENTER after br -> 'a'",
                content: "<ul><li><p>dom<br/>◆&nbsp;to edit</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<ul><li><p>dom<br/><br/></p></li><li><p>a◆ to edit</p></li></ul>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "within p (p before and after): 3x SHIFT+ENTER -> 3x BACKSPACE",
                content: "<p>dom not to edit</p><p>dom t◆o edit</p><p>dom not to edit</p>",
                steps: [{
                        key: 'ENTER',
                        shiftKey: true,
                    },
                    {
                        key: 'ENTER',
                        shiftKey: true,
                    },
                    {
                        key: 'ENTER',
                        shiftKey: true,
                    },
                    {
                        key: 'BACKSPACE',
                    },
                    {
                        key: 'BACKSPACE',
                    },
                    {
                        key: 'BACKSPACE',
                    }
                ],
                test: "<p>dom not to edit</p><p>dom t◆o edit</p><p>dom not to edit</p>",
            },
            {
                name: "in h1.a > font: 'a' on selection of all contents",
                content: '<h1 class="a"><font style="font-size: 62px;">▶dom to edit◀</font></h1>',
                steps: [{
                    key: 'a',
                }],
                test: '<h1 class="a"><font style="font-size:62px">a◆</font></h1>',
            },
            {
                name: "in complex-dom: BACKSPACE on partial selection (requires merging non-similar blocks)",
                content: '<p class="a">pi▶f</p><p><span><b>paf</b></span></p><ul><li><p>p<i>ou◀f</i></p></li></ul>',
                steps: [{
                    key: 'BACKSPACE',
                }],
                test: '<p class="a">pi◆<i>f</i></p>',
            },
            {
                name: "in complex-dom: DELETE on partial selection (requires merging non-similar blocks)",
                content: '<p class="a">pi▶f</p><p><span><b>paf</b></span></p><ul><li><p>p<i>ou◀f</i></p></li></ul>',
                steps: [{
                    key: 'DELETE',
                }],
                test: '<p class="a">pi◆<i>f</i></p>',
            },

            // paragraph outdent

            {
                name: "in p (h1 before): TAB -> BACKSPACE at start (must indent then outdent)",
                content: "<h1>dom not to edit</h1><p>◆dom to edit</p>",
                steps: [{
                    key: 'TAB',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<h1>dom not to edit</h1><p>◆dom to edit</p>",
            },
            {
                name: "in p (h1 before): TAB -> 2x BACKSPACE at start (must indent then outdent, then merge blocks)",
                content: "<h1>dom not to edit</h1><p>◆dom to edit</p>",
                steps: [{
                    key: 'TAB',
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<h1>dom not to edit◆dom to edit</h1>",
            },
            {
                name: "in p: SHIFT+ENTER at end -> BACKSPACE",
                content: "<p>dom to edit◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>dom to edit◆</p>",
            },
            {
                name: "in p: 2x SHIFT+ENTER within text -> BACKSPACE",
                content: "<p>dom t◆o edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>dom t<br/>◆o edit</p>",
            },
            {
                name: "in p: 2x SHIFT+ENTER at end -> 2x BACKSPACE",
                content: "<p>dom to edit◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'BACKSPACE',
                }, {
                    key: 'BACKSPACE',
                }],
                test: "<p>dom to edit◆</p>",
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

we3.addPlugin('TestKeyboardComplex', TestKeyboardComplex);

})();
