(function () {
'use strict';

var TestKeyboardEnter = class extends we3.AbstractPlugin {
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
                name: "in empty p: ENTER",
                content: "<p><br/>◆</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><br/></p><p>▶<br/>◀</p>",
            },
            {
                name: "in p: ENTER at start",
                content: "<p>◆dom to edit</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><br/></p><p>◆dom to edit</p>",
            },
            {
                name: "in p: ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p>d</p><p>◆om to edit</p>",
            },
            {
                name: "in p: 2x ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                }],
                test: "<p>d</p><p><br/></p><p>◆om to edit</p>",
            },
            {
                name: "in p: ENTER at end",
                content: "<p>dom to edit◆</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p>dom to edit</p><p>▶<br/>◀</p>",
            },
            {
                name: "in p: SHIFT+ENTER at start",
                content: "<p>◆dom to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><br/>◆dom to edit</p>",
            },
            {
                name: "in p: SHIFT+ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>d<br/>◆om to edit</p>",
            },
            {
                name: "in p: 2x SHIFT+ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>d<br/><br/>◆om to edit</p>",
            },
            {
                name: "in p: SHIFT+ENTER at end",
                content: "<p>dom to edit◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>dom to edit<br/>▶<br/>◀</p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in empty-p: SHIFT+ENTER",
                content: "<p><br/>◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><br/>▶<br/>◀</p>",
            },
            {
                name: "in p: 2x SHIFT+ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>d<br/><br/>◆om to edit</p>",
            },
            {
                name: "in empty-p: 2x SHIFT+ENTER",
                content: "<p><br/>◆</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><br/><br/>▶<br/>◀</p>",
            },
            {
                name: "in p: ENTER -> SHIFT+ENTER",
                content: "<p>d◆om to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>d</p><p><br/>◆om to edit</p>",
            },
            {
                name: "in p: ENTER on selection",
                content: "<p>d▶om to ◀edit</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p>d</p><p>◆edit</p>",
            },
            {
                name: "in p: SHIFT+ENTER on selection",
                content: "<p>d▶om to ◀edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>d<br/>◆edit</p>",
            },

            // list UL / OL

            {
                name: "in li: SHIFT+ENTER at start",
                content: "<ul><li>◆dom to edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<ul><li><br/>◆dom to edit</li></ul>",
            },
            {
                name: "in li: SHIFT+ENTER within contents",
                content: "<ul><li>dom t◆o edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<ul><li>dom t<br/>◆o edit</li></ul>",
            },
            {
                name: "in empty-li: SHIFT+ENTER",
                content: "<ul><li><br/>◆</li></ul>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<ul><li><br/>▶<br/>◀</li></ul>",
            },
            {
                name: "in li: SHIFT+ENTER on selection",
                content: "<ul><li>d▶om to ◀edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<ul><li>d<br/>◆edit</li></ul>",
            },
            {
                name: "in li: ENTER at start",
                content: "<ul><li>◆dom to edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li><br/></li><li>◆dom to edit</li></ul>",
            },
            {
                name: "in li: ENTER within contents",
                content: "<ul><li>dom t◆o edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li>dom t</li><li>◆o edit</li></ul>",
            },
            {
                name: "in li: ENTER on selection",
                content: "<ul><li>d▶om to ◀edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li>d</li><li>◆edit</li></ul>",
            },
            {
                name: "in li: ENTER on selection of all contents",
                content: "<ul><li>▶dom to edit◀</li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li><br/></li><li>▶<br/>◀</li></ul>",
            },
            {
                name: "in li: ENTER -> 'a' on selection of all contents",
                content: "<ul><li>▶dom to edit◀</li></ul>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<ul><li><br/></li><li>a◆</li></ul>",
            },
            {
                name: "across 2 li: ENTER on partial selection",
                content: "<ul><li>d▶om to edit</li><li>dom ◀to edit</li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li>d</li><li>◆to edit</li></ul>",
            },
            {
                name: "in li: ENTER at end",
                content: "<ul><li><p>dom to edit◆</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<ul><li><p>dom to edit</p></li><li>▶<br/>◀</li></ul>",
            },
            {
                name: "in li: 2x ENTER at end",
                content: "<ul><li><p>dom to edit◆</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                }],
                test: "<ul><li><p>dom to edit◆</p></li></ul>",
            },
            // {
            //     name: "in ul.list-group > li: ENTER at end",
            //     content: '<ul class="list-group"><li><p>dom to edit</p></li></ul>',
            //     steps: [{
            //         start: "p:contents()[0]->11",
            //         key: 'ENTER',
            //     }, {
            //         key: 'ENTER',
            //     }],
            //     test: '<ul class="list-group"><li><p>dom to edit</p></li><li><p><br/></p></li><li><p><br/>◆</p></li></ul>',
            // },
            {
                name: "in indented-li: 2x ENTER at end",
                content: "<ul><li><p>aaa</p></li><li><ul><li><p>dom to edit◆</p></li></ul></li><li><p>bbb</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                }],
                test: '<ul><li><p>aaa</p></li><li class="o_indent"><ul><li><p>dom to edit</p></li></ul></li><li>▶<br/>◀</li><li><p>bbb</p></li></ul>',
            },
            {
                name: "in indented-li with font: 2x ENTER at end",
                content: '<ul><li><p>aaa</p></li><ul><li><p><font style="color: red;">dom to edit◆</font></p></li></ul><li><p>bbb</p></li></ul>',
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                }],
                test: '<ul><li><p>aaa</p></li><li class="o_indent"><ul><li><p><font style="color:red">dom to edit</font></p></li></ul></li><li>▶<br/>◀</li><li><p>bbb</p></li></ul>',
            },
            {
                name: "in li > empty-p: ENTER",
                content: "<ul><li><p><br/>◆</p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p>▶<br/>◀</p>",
            },
            {
                name: "in li > p > empty-b: ENTER",
                content: "<ul><li><p><b><br/>◆</b></p></li></ul>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><b>▶<br/>◀</b></p>",
            },

            // end list UL / OL

            {
                name: "after p > b: SHIFT+ENTER",
                content: "<p><b>dom</b>◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><b>dom▶<br/>◀</b> to edit</p>",
            },
            {
                name: "in p > b: ENTER -> 'a'",
                content: "<p><b>do◆m to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><b>do</b></p><p><b>a◆m to edit</b></p>",
            },
            {
                name: "after p > b: ENTER -> 'a'",
                content: "<p><b>dom</b>◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom</b></p><p>a◆ to edit</p>",
            },
            {
                name: "after p > b: SHIFT+ENTER -> 'a'",
                content: "<p><b>dom</b>◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom<br/>a◆</b> to edit</p>", // after b always reranges to within b
            },
            {
                name: "in p (other-p > span.a before - p > span.b after): ENTER at beginning",
                content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">◆edit</span></p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/></span></p><p><span class=\"b\">◆edit</span></p>",
            },
            {
                name: "in p (other-p > span.a before - p > span.b after): ENTER -> 'a' at beginning",
                content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">◆edit</span></p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/></span></p><p><span class=\"b\">a◆edit</span></p>",
            },
            {
                name: "in p (other-p > span.a before - p > span.b after): SHIFT+ENTER at beginning",
                content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">◆edit</span></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/>◆edit</span></p>",
            },
            {
                name: "in p (other-p > span.a before - p > span.b after): SHIFT+ENTER -> 'a' at beginning",
                content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">◆edit</span></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/>a◆edit</span></p>",
            },
            {
                name: "in p: ENTER on selection of all contents",
                content: "<p>▶dom to edit◀</p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><br/></p><p>▶<br/>◀</p>",
            },
            {
                name: "in p: ENTER -> 'a' on selection of all contents",
                content: "<p>▶dom to edit◀</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><br/></p><p>a◆</p>",
            },
            {
                name: "in p: SHIFT+ENTER on selection of all contents",
                content: "<p>▶dom to edit◀</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><br/>▶<br/>◀</p>",
            },
            {
                name: "in p: SHIFT+ENTER -> 'a' on selection of all contents",
                content: "<p>▶dom to edit◀</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p><br/>a◆</p>",
            },
            {
                name: "in p: 2x ENTER -> 'a' within text",
                content: "<p>dom◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p>dom</p><p><br/></p><p>a◆ to edit</p>",
            },
            {
                name: "in p > b: ENTER at start",
                content: "<p><b>◆dom to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><b><br/></b></p><p><b>◆dom to edit</b></p>",
            },
            {
                name: "in p > b: ENTER",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><b>dom</b></p><p><b>◆&nbsp;to edit</b></p>",
            },
            {
                name: "in p > b: SHIFT+ENTER -> ENTER",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }],
                test: "<p><b>dom<br/><br/></b></p><p><b>◆&nbsp;to edit</b></p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in p > b: ENTER -> a'",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom</b></p><p><b>a◆ to edit</b></p>",
            },
            {
                name: "in p > b: SHIFT+ENTER",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><b>dom<br/>◆&nbsp;to edit</b></p>",
            },
            {
                name: "in p > b: SHIFT+ENTER -> 'a'",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom<br/>a◆ to edit</b></p>",
            },
            {
                name: "in p > b: SHIFT+ENTER -> ENTER -> 'a'",
                content: "<p><b>dom◆ to edit</b></p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><b>dom<br/><br/></b></p><p><b>a◆ to edit</b></p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in span > b: ENTER",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                }],
                test: "<p><span><b>dom</b></span></p><p><span><b>◆&nbsp;to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER -> ENTER",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }],
                test: "<p><span><b>dom<br/><br/></b></span></p><p><span><b>◆&nbsp;to edit</b></span></p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in span > b: ENTER -> 'a'",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><span><b>dom</b></span></p><p><span><b>a◆ to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p><span><b>dom<br/>◆&nbsp;to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER -> 'a'",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p><span><b>dom<br/>a◆ to edit</b></span></p>",
            },
            {
                name: "in span > b: SHIFT+ENTER -> ENTER -> 'a'",
                content: "<span><b>dom◆ to edit</b></span>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p><span><b>dom<br/><br/></b></span></p><p><span><b>a◆ to edit</b></span></p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in p: 2x SHIFT+ENTER -> 'a'",
                content: "<p>dom◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p>dom<br/><br/>a◆ to edit</p>",
            },
            {
                name: "in p: ENTER -> SHIFT+ENTER -> 'a'",
                content: "<p>dom◆ to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    key: 'a',
                }],
                test: "<p>dom</p><p><br/>a◆ to edit</p>",
            },
            {
                name: "in empty-p (p before and after): ENTER -> 'a'",
                content: "<p>dom\u00A0</p><p><br/>◆</p><p>to edit</p>",
                steps: [{
                    key: 'ENTER',
                }, {
                    key: 'a',
                }],
                test: "<p>dom&nbsp;</p><p><br/></p><p>a◆</p><p>to edit</p>",
            },
            {
                name: "in p: SHIFT+ENTER at end",
                content: "<p>dom\u00A0◆</p><p>to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }],
                test: "<p>dom <br/>▶<br/>◀</p><p>to edit</p>",
                // the extra BR appeared to make the first one visible
            },
            {
                name: "in p: SHIFT+ENTER at end -> '寺'",
                content: "<p>dom\u00A0◆</p><p>to edit</p>",
                steps: [{
                    key: 'ENTER',
                    shiftKey: true,
                }, {
                    keyCode: 23546, /*temple in chinese*/
                }],
                test: "<p>dom <br/>寺◆</p><p>to edit</p>",
            },
            {
                name: "in empty-p (div > a after): 3x SHIFT+ENTER -> 'a'",
                content: "<p><br/>◆</p><div><a href='#'>dom to edit</a></div>",
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
                        key: 'a',
                    }
                ],
                test: "<p><br/><br/><br/>a◆</p><div><a href=\"#\">dom to edit</a></div>",
            },
            {
                name: "in p: 2x SHIFT+ENTER on selection",
                content: "<p>a▶b◀c</p>",
                steps: [{
                        key: 'ENTER',
                        shiftKey: true,
                    },
                    {
                        key: 'ENTER',
                        shiftKey: true,
                    },
                ],
                test: "<p>a<br/><br/>◆c</p>",
            },
            // {
            //     name: "after p > b: SHIFT+ENTER -> 'a'",
            //     content: "<p><b>dom</b>&nbsp;to edit</p>",
            //     steps: [{
            //         start: "p:contents()[1]->0",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><b>dom</b><br/>a&nbsp;to edit</p>",
            //         start: "p:contents()[2]->1",
            //     },
            // },
            // {
            //     name: "in p (other-p > span.a before - p > span.b after): ENTER at beginning",
            //     content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">edit</span></p>",
            //     steps: [{
            //         start: "p:eq(1):contents()[0]->0",
            //         key: 'ENTER',
            //     }],
            //     test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/></span></p><p><span class=\"b\">edit</span></p>",
            //         start: "span:eq(2):contents()[0]->0",
            //     },
            // },
            // {
            //     name: "in p (other-p > span.a before - p > span.b after): ENTER -> 'a' at beginning",
            //     content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">edit</span></p>",
            //     steps: [{
            //         start: "p:eq(1):contents()[0]->0",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/></span></p><p><span class=\"b\">aedit</span></p>",
            //         start: "span:eq(2):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p (other-p > span.a before - p > span.b after): SHIFT+ENTER at beginning",
            //     content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">edit</span></p>",
            //     steps: [{
            //         start: "p:eq(1):contents()[0]->0",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }],
            //     test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/>edit</span></p>",
            //         start: "span:eq(1):contents()[1]->0",
            //     },
            // },
            // {
            //     name: "in p (other-p > span.a before - p > span.b after): SHIFT+ENTER -> 'a' at beginning",
            //     content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">edit</span></p>",
            //     steps: [{
            //         start: "p:eq(1):contents()[0]->0",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/>aedit</span></p>",
            //         start: "span:eq(1):contents()[1]->1",
            //     },
            // },
            // {
            //     name: "in p: ENTER on selection of all contents",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->0",
            //         end: "p:contents()[0]->11",
            //         key: 'ENTER',
            //     }],
            //     test: "<p><br/></p><p><br/></p>",
            //         start: "p:eq(1)->1",
            //     },
            // },
            // {
            //     name: "in p: ENTER -> 'a' on selection of all contents",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->0",
            //         end: "p:contents()[0]->11",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><br/></p><p>a</p>",
            //         start: "p:eq(1):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p: SHIFT+ENTER on selection of all contents",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->0",
            //         end: "p:contents()[0]->11",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }],
            //     test: "<p><br/><br/></p>",
            //         start: "br:eq(1)->0",
            //     },
            // },
            // {
            //     name: "in p: SHIFT+ENTER -> 'a' on selection of all contents",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->0",
            //         end: "p:contents()[0]->11",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><br/>a</p>",
            //         start: "p:contents()[1]->1",
            //     },
            // },
            // {
            //     name: "in p: 2x ENTER -> 'a' on selection of all contents",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->3",
            //         key: 'ENTER',
            //     }, {
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p>dom</p><p><br/></p><p>a&nbsp;to edit</p>",
            //         start: "p:eq(2):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p > b: ENTER at start",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->0",
            //         key: 'ENTER',
            //     }],
            //     test: "<p><b><br/></b></p><p><b>dom to edit</b></p>",
            //         start: "b:eq(1):contents()[0]->0",
            //     },
            // },
            // {
            //     name: "in p > b: ENTER",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //     }],
            //     test: "<p><b>dom</b></p><p><b>&nbsp;to edit</b></p>",
            //         start: "b:eq(1):contents()[0]->0",
            //     },
            // },
            // {
            //     name: "in p > b: SHIFT+ENTER -> ENTER",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'ENTER',
            //     }],
            //     test: "<p><b>dom<br/>&#65279;</b></p><p><b>&nbsp;to edit</b></p>",
            //         start: "b:eq(1):contents()[0]->0",
            //     },
            // },
            // {
            //     name: "in p > b: ENTER -> a'",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><b>dom</b></p><p><b>a&nbsp;to edit</b></p>",
            //         start: "b:eq(1):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p > b: SHIFT+ENTER",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }],
            //     test: "<p><b>dom<br/>&nbsp;to edit</b></p>",
            //         start: "b:contents()[2]->0",
            //     },
            // },
            // {
            //     name: "in p > b: SHIFT+ENTER -> 'a'",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><b>dom<br/>a&nbsp;to edit</b></p>",
            //         start: "b:contents()[2]->1",
            //     },
            // },
            // {
            //     name: "in p > b: SHIFT+ENTER -> ENTER -> 'a'",
            //     content: "<p><b>dom to edit</b></p>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p><b>dom<br/>&#65279;</b></p><p><b>a&nbsp;to edit</b></p>",
            //         start: "b:eq(1):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in span > b: ENTER",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //     }],
            //     test: "<span><b>dom</b></span><br/><span><b>&nbsp;to edit</b></span>",
            //         start: "b:eq(1)->0",
            //     },
            // },
            // {
            //     name: "in span > b: SHIFT+ENTER -> ENTER",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'ENTER',
            //     }],
            //     test: "<span><b>dom<br/></b></span><br/><span><b>&nbsp;to edit</b></span>",
            //         start: "b:eq(1)->0",
            //     },
            // },
            // {
            //     name: "in span > b: ENTER -> 'a'",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<span><b>dom</b></span><br/><span><b>a&nbsp;to edit</b></span>",
            //         start: "b:eq(1):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in span > b: SHIFT+ENTER",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }],
            //     test: "<span><b>dom<br/>&nbsp;to edit</b></span>",
            //         start: "b:contents()[2]->0",
            //     },
            // },
            // {
            //     name: "in span > b: SHIFT+ENTER -> 'a'",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<span><b>dom<br/>a&nbsp;to edit</b></span>",
            //         start: "b:contents()[2]->1",
            //     },
            // },
            // {
            //     name: "in span > b: SHIFT+ENTER -> ENTER -> 'a'",
            //     content: "<span><b>dom to edit</b></span>",
            //     steps: [{
            //         start: "b:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<span><b>dom<br/></b></span><br/><span><b>a&nbsp;to edit</b></span>",
            //         start: "b:eq(1):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p: 2x SHIFT+ENTER -> 'a'",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->3",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p>dom<br/><br/>a&nbsp;to edit</p>",
            //         start: "p:contents()[3]->1",
            //     },
            // },
            // {
            //     name: "in p: ENTER -> SHIFT+ENTER -> 'a'",
            //     content: "<p>dom to edit</p>",
            //     steps: [{
            //         start: "p:contents()[0]->3",
            //         key: 'ENTER',
            //     }, {
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p>dom</p><p><br/>a&nbsp;to edit</p>",
            //         start: "p:eq(1):contents()[1]->1",
            //     },
            // },
            // {
            //     name: "in empty-p (p before and after): ENTER -> 'a'",
            //     content: "<p>dom </p><p><br/></p><p>to edit</p>",
            //     steps: [{
            //         start: "p:eq(1):contents()[0]->0",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: "<p>dom </p><p><br/></p><p>a</p><p>to edit</p>",
            //         start: "p:eq(2):contents()[0]->1",
            //     },
            // },
            // {
            //     name: "in p: SHIFT+ENTER at end",
            //     content: "<p>dom </p><p>to edit</p>",
            //     steps: [{
            //         start: "p:first:contents()[0]->4",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }],
            //     test: "<p>dom <br/>&#65279;</p><p>to edit</p>",
            //         start: "p:first:contents()[2]->0",
            //     },
            // },
            // {
            //     name: "in p: SHIFT+ENTER at end -> '寺'",
            //     content: "<p>dom </p><p>to edit</p>",
            //     steps: [{
            //         start: "p:first:contents()[0]->4",
            //         key: 'ENTER',
            //         shiftKey: true,
            //     }, {
            //         keyCode: 23546, /*temple in chinese*/
            //     }],
            //     test: "<p>dom <br/>寺</p><p>to edit</p>",
            //         start: "p:first:contents()[2]->1",
            //     },
            // },
            // {
            //     name: "in empty-p (div > a after): 3x SHIFT+ENTER -> 'a'",
            //     content: "<p><br/></p><div><a href='#'>dom to edit</a></div>",
            //     steps: [{
            //             start: "p->1",
            //             key: 'ENTER',
            //             shiftKey: true,
            //         },
            //         {
            //             key: 'ENTER',
            //             shiftKey: true,
            //         },
            //         {
            //             key: 'ENTER',
            //             shiftKey: true,
            //         },
            //         {
            //             key: 'a',
            //         }
            //     ],
            //     test: "<p><br/><br/><br/>a</p><div><a href=\"#\">dom to edit</a></div>",
            //         start: "p:contents()[3]->1",
            //     },
            // },

            // Buttons
            // TODO: RESTORE

            // {
            //     name: "in div > a.btn: ENTER -> 'a' at start (before invisible space)",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->0",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">Label</a><a class=\"btn\" href=\"#\">&#65279;adom to edit&#65279;</a></div>",
            //         // split button has no text so the placeholder text is selected then replaced by 'a'
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' at start (after invisible space)",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->1",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">Label</a><a class=\"btn\" href=\"#\">&#65279;adom to edit&#65279;</a></div>",
            //         // split button has no text so the placeholder text is selected then replaced by 'a'
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' within contents",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->6",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom t</a><a class=\"btn\" href=\"#\">&#65279;ao edit&#65279;</a></div>",
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' at end (before invisible space)",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->12",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom to edit</a><a class=\"btn\" href=\"#\">&#65279;a&#65279;</a></div>",
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' at end (after invisible space)",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->13",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom to edit</a><a class=\"btn\" href=\"#\">&#65279;a&#65279;</a></div>",
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > button.btn: ENTER -> 'a' at end (after invisible space)",
            //     content: "<div class=\"unbreakable\"><button class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</button></div>",
            //     steps: [{
            //         start: "button:contents()[0]->13",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><button class=\"btn\" href=\"#\">dom to edit</button><button class=\"btn\" href=\"#\">&#65279;a&#65279;</button></div>",
            //         start: "button:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' on partial selection",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">&#65279;dom to edit&#65279;</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->4",
            //         end: "a:contents()[0]->8",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom</a><a class=\"btn\" href=\"#\">&#65279;aedit&#65279;</a></div>",
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "in div > a.btn: ENTER -> 'a' on selection of all visible text",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom to edit</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->0",
            //         end: "a:contents()[0]->11",
            //         key: 'ENTER',
            //     }, {
            //         key: 'a',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">Label</a><a class=\"btn\" href=\"#\">&#65279;a&#65279;</a></div>",
            //         // Removing all text in a link replaces that text with "Label"
            //         start: "a:eq(1):contents()[0]->2",
            //     },
            // },
            // {
            //     name: "across 2 a.btn: ENTER on selection across two a.btn",
            //     content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">dom not to edit</a><a class=\"btn\" href=\"#\">other dom not to edit</a></div>",
            //     steps: [{
            //         start: "a:contents()[0]->0",
            //         end: "a:eq(1):contents()[0]->11",
            //         key: 'ENTER',
            //     }],
            //     test: {
            //         content: "<div class=\"unbreakable\"><a class=\"btn\" href=\"#\">Label</a><a class=\"btn\" href=\"#\">&#65279;ot to edit&#65279;</a></div>",
            //         start: "a:eq(1):contents()[0]->1",
            //     },
            // },
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

we3.addPlugin('TestKeyboardEnter', TestKeyboardEnter);

})();
