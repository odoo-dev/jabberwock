(function () {
'use strict';

var TestKeyboardChar = class extends we3.AbstractPlugin {
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
                name: "no changes",
                content: "<p>dom▶ to◀ edit</p>",
                steps: [],
                test: "<p>dom▶ to◀ edit</p>",
            },
            {
                name: "visible char in selected text",
                content: "<p>a▶a◀a</p>",
                steps: [{
                    key: 'w',
                }],
                test: "<p>aw◆a</p>",
            },
            {
                name: "visible char in selected text with two line",
                content: "<p>a▶a◀a</p><p>bbb</p>",
                steps: [{
                    key: 'w',
                }],
                test: "<p>aw◆a</p><p>bbb</p>",
            },
            {
                name: "visible char in empty p tag",
                content: "<p><br>◆</p>",
                steps: [{
                    key: 'w',
                }],
                test: "<p>w◆</p>",
            },
            {
                name: "multiple visible chars in empty p tag",
                content: "<p>◆<br></p>",
                steps: Array.from('we3 editor @ Odoo', function (char) {
                    return {key: char};
                }),
                test: "<p>we3 editor @ Odoo◆</p>",
            },
            {
                name: "multiple visible chars in blank editor",
                content: "◆",
                steps: Array.from('we3 editor @ Odoo', function (char) {
                    return {key: char};
                }),
                test: "<p>we3 editor @ Odoo◆</p>",
            },
            {
                name: "visible char in a p tag",
                content: "<p>dom◆ to edit</p>",
                steps: [{
                    keyCode: 66,
                }],
                test: "<p>domB◆ to edit</p>",
            },
            {
                name: "visible char in a b tag in a p tag",
                content: "<p>do<b>m◆ to</b> edit</p>",
                steps: [{
                    keyCode: 66,
                }],
                test: "<p>do<b>mB◆ to</b> edit</p>",
            },
            {
                name: "visible char in a link tag entirely selected",
                content: '<div><a href="#">▶dom to edit◀</a></div>',
                steps: [{
                    key: 'a',
                }],
                test: '<div><a href="#">a◆</a></div>',
            },
            {
                name: "'a' on a selection of most contents of a complex dom",
                content: "<p><b>dom</b></p><p><b>▶to<br>partly</b>remov<i>e◀</i></p>",
                steps: [{
                    key: 'a',
                }],
                test: "<p><b>dom</b></p><p><b>a◆</b></p>",
            },
            {
                name: "'a' on a selection of all the contents of a complex dom",
                content: "<p><b>▶dom</b></p><p><b>to<br>completely</b>remov<i>e◀</i></p>",
                steps: [{
                    key: 'a',
                }],
                test: "<p><b>a◆</b></p>",
            },
            {
                name: "'a' on a selection of all the contents of a complex dom (2)",
                content: '<h1 class="a"><font style="font-size: 62px;"><b>▶dom to</b>edit◀</font></h1>',
                steps: [{
                    key: 'a',
                }],
                test: '<h1 class="a"><font style="font-size:62px"><b>a◆</b></font></h1>',
            },
            {
                name: "'a' before an image",
                content: '<p>xxx ◆<img src="/web_editor/static/src/img/transparent.png"/> yyy</p>',
                steps: [{
                    key: 'a',
                }],
                test: '<p>xxx a◆<img src="/web_editor/static/src/img/transparent.png"/> yyy</p>',
            },
            {
                name: "'a' before an image (2)",
                content: '<p>xxx ◆<img src="/web_editor/static/src/img/transparent.png"/> yyy</p>',
                steps: [{
                    key: 'a',
                }],
                test: '<p>xxx a◆<img src="/web_editor/static/src/img/transparent.png"/> yyy</p>',
            },
            {
                name: "'a' before an image in table",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "'a' on invisible text before an image in table",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "'a' before an image in table without spaces",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "'a' before an image in table without spaces (2)",
                content: '<table><tbody><tr><td><p>xxx</p></td><td><p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p></td><td><p>yyy</p></td></tr></tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test: '<table><tbody><tr><td><p>xxx</p></td><td><p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p></td><td><p>yyy</p></td></tr></tbody></table>',
            },
            {
                name: "'a' before an image in table with spaces",
                content:
                    '<table><tbody>\n' +
                    '   <tr>\n' +
                    '       <td>\n' +
                    '           <p>xxx</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>yyy</p>\n' +
                    '       </td>\n' +
                    '   </tr>\n' +
                    '</tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test:   '<table><tbody>' +
                            '<tr>' +
                                '<td>' +
                                    '<p>xxx</p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>yyy</p>' +
                                '</td>' +
                            '</tr>' +
                        '</tbody></table>',
            },
            {
                name: "'a' before an image in table with spaces (2)",
                content:
                    '<table><tbody>\n' +
                    '   <tr>\n' +
                    '       <td>\n' +
                    '           <p>xxx</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>yyy</p>\n' +
                    '       </td>\n' +
                    '   </tr>\n' +
                    '</tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test:   '<table><tbody>' +
                            '<tr>' +
                                '<td>' +
                                    '<p>xxx</p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>yyy</p>' +
                                '</td>' +
                            '</tr>' +
                        '</tbody></table>',
            },
            {
                name: "'a' before an image in table with spaces (3)",
                content:
                    '<table><tbody>\n' +
                    '   <tr>\n' +
                    '       <td>\n' +
                    '           <p>xxx</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>▶<img src="/web_editor/static/src/img/transparent.png"/>◀</p>\n' +
                    '       </td>\n' +
                    '       <td>\n' +
                    '           <p>yyy</p>\n' +
                    '       </td>\n' +
                    '   </tr>\n' +
                    '</tbody></table>',
                steps: [{
                    key: 'LEFT',
                }, {
                    key: 'a',
                }],
                test:   '<table><tbody>' +
                            '<tr>' +
                                '<td>' +
                                    '<p>xxx</p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>a◆<img src="/web_editor/static/src/img/transparent.png"/></p>' +
                                '</td>' +
                                '<td>' +
                                    '<p>yyy</p>' +
                                '</td>' +
                            '</tr>' +
                        '</tbody></table>',
            },
            /* {
                name: "'a' on all contents of p starting with an icon",
                content: '<p><span class="fa fa-star"></span>bbb</p>',
                steps: [{
                    key: 'a',
                }],
                test: '<p>a◆</p>',
            }, */
            {
                name: "' ' at start of p",
                content: '<p>◆dom to edit</p>',
                steps: [{
                    key: ' ',
                }],
                test: '<p>&nbsp;◆dom to edit</p>',
            },
            {
                name: "' ' at end of p",
                content: '<p>dom to edit◆</p>',
                steps: [{
                    key: ' ',
                }],
                test: '<p>dom to edit&nbsp;◆</p>',
            },
            {
                name: "' ' within p",
                content: '<p>do◆m to edit</p>',
                steps: [{
                    key: ' ',
                }],
                test: '<p>do ◆m to edit</p>',
            },
            {
                name: "' ' before space within p",
                content: '<p>dom◆ to edit</p>',
                steps: [{
                    key: ' ',
                }],
                test: '<p>dom ◆&nbsp;to edit</p>',
            },
            {
                name: "' ' after space within p",
                content: '<p>dom ◆to edit</p>',
                steps: [{
                    key: ' ',
                }],
                test: '<p>dom &nbsp;◆to edit</p>',
            },
            {
                name: "3x ' ' at start of p",
                content: '<p>◆dom to edit</p>',
                steps: [{
                    key: ' ',
                }, {
                    key: ' ',
                }, {
                    key: ' ',
                }],
                test: '<p>&nbsp; &nbsp;◆dom to edit</p>',
            },
            {
                name: "3x ' ' at end of p",
                content: '<p>dom to edit◆</p>',
                steps: [{
                    key: ' ',
                }, {
                    key: ' ',
                }, {
                    key: ' ',
                }],
                test: '<p>dom to edit &nbsp;&nbsp;◆</p>',
            },
            {
                name: "3x ' ' within p",
                content: '<p>do◆m to edit</p>',
                steps: [{
                    key: ' ',
                }, {
                    key: ' ',
                }, {
                    key: ' ',
                }],
                test: '<p>do &nbsp; ◆m to edit</p>',
            },
            {
                name: "3x ' ' before space in p",
                content: '<p>dom◆ to edit</p>',
                steps: [{
                    key: ' ',
                }, {
                    key: ' ',
                }, {
                    key: ' ',
                }],
                test: '<p>dom &nbsp; ◆&nbsp;to edit</p>',
            },
            {
                name: "3x ' ' after space in p",
                content: '<p>dom ◆to edit</p>',
                steps: [{
                    key: ' ',
                }, {
                    key: ' ',
                }, {
                    key: ' ',
                }],
                test: '<p>dom &nbsp; &nbsp;◆to edit</p>',
            },
            {
                name: "'b' on selection across br",
                content: '<p>dom▶<br/>t◀o edit</p>',
                steps: [{
                    key: 'b',
                }],
                test: '<p>domb◆o edit</p>',
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

we3.addPlugin('TestKeyboardChar', TestKeyboardChar);

})();
