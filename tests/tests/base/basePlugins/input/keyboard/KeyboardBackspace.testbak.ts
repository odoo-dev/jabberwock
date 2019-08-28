(function () {
'use strict';

var TestKeyboardBackspace = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestKeyboard'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test', 'TestKeyboard'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.keyboardTests = [{
            name: "in p: BACKSPACE after i.fa (voidoid)",
            content: '<p>aaa<i class="fa fa-star"></i>◆bbb</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>aaa◆bbb</p>',
        }, {
            name: "in p: BACKSPACE on selected i.fa (voidoid)",
            content: '<p>aaa▶<i class="fa fa-star"></i>◀bbb</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>aaa◆bbb</p>',
        }, {
            name: "in p: BACKSPACE before i.fa (voidoid)",
            content: '<p>aaa◆<i class="fa fa-star"></i>bbb</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>aa◆<i class="fa fa-star"></i>bbb</p>',
        }, {
            name: "in empty-p: BACKSPACE (should do nothing)",
            content: "<p><br>◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>▶<br/>◀</p>",
        },{
            name: "in p: 2 x BACKSPACE after br + 1 char",
            content: "<p>aaa</p><p><br>a◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<p>aaa</p><p>▶<br/>◀</p>",
        },
        {
            name: "in p (empty-p before): BACKSPACE",
            content: "<p><br></p><p>◆dom to edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>◆dom to edit</p>",
        },
        {
            name: "in p (empty-p.a before): BACKSPACE",
            content: '<p class="a"><br></p><p>◆dom to edit</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p class="a">◆dom to edit</p>',
        },
        {
            name: "in p: BACKSPACE within text",
            content: "<p>dom t◆o edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>dom ◆o edit</p>",
        },
        {
            name: "in p: 2x BACKSPACE within text",
            content: "<p>dom t◆o edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<p>dom◆o edit</p>",
        },
        {
            name: "in p: 2x BACKSPACE to empty a p with text",
            content: "<p>a</p><p>bc◆</p><p>d</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<p>a</p><p>▶<br/>◀</p><p>d</p>",
        },
        {
            name: "in p (p > span.a before - span.b after): BACKSPACE at beginning (must attach them)",
            content: '<p><span class="a">dom to</span></p><p><span class="b">◆edit</span></p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><span class=\"a\">dom to</span><span class=\"b\">◆edit</span></p>",
        },
        {
            name: "in p (p > span.a before - span.a after): BACKSPACE (must merge them)",
            content: '<p><span class="a">dom to</span></p><p><span class="a">◆edit</span></p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><span class=\"a\">dom to◆edit</span></p>",
        },
        {
            name: "in p (b before): BACKSPACE",
            content: "<p><b>dom</b>◆ to edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><b>do◆</b> to edit</p>", // after b always reranges to within b
        },
        {
            name: "in p (div > span.a before - span.a after): BACKSPACE at beginning (must do nothing)",
            content: "<div><p><span class=\"a\">dom to&nbsp;</span></p></div><p><span class=\"a\">◆edit</span></p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<div><p><span class=\"a\">dom to&nbsp;</span></p></div><p><span class=\"a\">◆edit</span></p>",
        },
        {
            name: "in p: BACKSPACE on partial selection",
            content: "<p>d▶om to ◀edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>d◆edit</p>",
        },
        {
            name: "across 2 p's: BACKSPACE on partial selection",
            content: "<p>d▶om</p><p>to ◀edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>d◆edit</p>",
        },
        {
            name: "in p: BACKSPACE after text-br-char",
            content: "<p>dom to edi<br>t◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>dom to edi<br/>▶<br/>◀</p>", // should insert new br to make it visible
        },
        {
            name: "in p: BACKSPACE -> 'a' at end, after space-char",
            content: "<p>dom t◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<p>dom a◆</p>",
        },
        {
            name: "in pre: BACKSPACE within text, with space at beginning",
            content: "<pre>     dom t◆o edit</pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre>     dom ◆o edit</pre>",
        },
        {
            name: "in pre: BACKSPACE within text, with one space at beginning",
            content: "<pre> dom t◆o edit</pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre> dom ◆o edit</pre>",
        },
        {
            name: "in pre: BACKSPACE within text, with space at end",
            content: "<pre>dom t◆o edit     </pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre>dom ◆o edit     </pre>",
        },
        {
            name: "in pre: BACKSPACE within text, with one space at end",
            content: "<pre>dom t◆o edit </pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre>dom ◆o edit </pre>",
        },
        {
            name: "in pre: BACKSPACE within text, with space at beginning and end",
            content: "<pre>     dom t◆o edit     </pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre>     dom ◆o edit     </pre>",
        },
        {
            name: "in pre: BACKSPACE within text, with one space at beginning and one at end",
            content: "<pre> dom t◆o edit </pre>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<pre> dom ◆o edit </pre>",
        },

        // list UL / OL

        {
            name: "from p to ul > li: BACKSPACE on whole list",
            content: "<p>dom not to edit▶</p><ul><li><p>dom to edit◀</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>dom not to edit◆</p>",
        },
        {
            name: "in ul > second-li > p: BACKSPACE at end",
            content: "<ul><li><p>dom to</p></li><li><p>edit◆</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>dom to</p></li><li><p>edi◆</p></li></ul>",
        },
        {
            name: "in ul > second-li > empty-p: BACKSPACE at beginning",
            content: "<ul><li><p><br></p></li><li><p><br>◆</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>▶<br/>◀</p></li></ul>",
        },
        {
            name: "in ul > indented-li (no other li - p before): BACKSPACE at beginning",
            content: "<p>dom to</p><ul><ul><li>◆edit</li></ul></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>dom to</p><ul><li>◆edit</li></ul>",
        },
        {
            name: "in ul > indented-li (no other li - p before): BACKSPACE -> 'a' at beginning",
            content: "<p>dom to</p><ul><ul><li>◆edit</li></ul></ul>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<p>dom to</p><ul><li>a◆edit</li></ul>",
        },
        {
            name: "in ul > indented-li (no other li - none before): BACKSPACE at beginning",
            content: "<ul><ul><li>◆dom to edit</li></ul></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li>◆dom to edit</li></ul>",
        },
        {
            name: "in li: BACKSPACE on partial selection",
            content: "<ul><li>d▶om to ◀edit</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li>d◆edit</li></ul>",
        },
        {
            name: "across 2 li: BACKSPACE on partial selection",
            content: "<ul><li>d▶om to edit</li><li>dom to ◀edit</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li>d◆edit</li></ul>",
        },
        {
            name: "in li (no other li): BACKSPACE on selection of all contents",
            content: "<ul><li>▶dom to edit◀</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li>▶<br/>◀</li></ul>",
        },
        {
            name: "in li (no other li): BACKSPACE -> 'a' on selection of all contents",
            content: "<ul><li>▶dom to edit◀</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<ul><li>a◆</li></ul>",
        },
        {
            name: "in empty-li: BACKSPACE (must remove list)",
            content: "<ul><li><br>◆</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>▶<br/>◀</p>",
        },
        {
            name: "in empty-li (no other li - empty-p before): BACKSPACE -> 'a'",
            content: "<p><br></p><ul><li><br>◆</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<p>a◆</p>",
        },
        {
            name: "in empty-li (no other li - p before): BACKSPACE",
            content: "<p>toto</p><ul><li><br>◆</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>toto</p><p>▶<br/>◀</p>",
        },
        {
            name: "in li (no other li - p before): BACKSPACE at start",
            content: "<p>toto</p><ul><li>◆&nbsp;<img src='/web_editor/static/src/img/transparent.png'></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>toto</p><p>◆&nbsp;<img src=\"/web_editor/static/src/img/transparent.png\"/></p>",
        },
        {
            name: "in empty-indented-li (other li - no other indented-li): BACKSPACE",
            content: "<ul><li><p>toto</p></li><ul><li><br>◆</li></ul><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>toto</p></li><li>▶<br/>◀</li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in empty-indented-li (other li - other indented-li): BACKSPACE",
            content: "<ul><li><p>toto</p></li><ul><li><br>◆</li><li><br></li></ul><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<ul><li><p>toto</p></li><li>▶<br/>◀</li><li class="o_indent"><ul><li><br/></li></ul></li><li><p>tutu</p></li></ul>',
        },
        {
            name: "in empty-indented-li (no other li, no other indented-li): BACKSPACE",
            content: "<ul><ul><li><br>◆</li></ul></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li>▶<br/>◀</li></ul>",
        },
        {
            name: "in indented-li (other li, other indented-li): BACKSPACE at start",
            content: "<ul><li><p>toto</p></li><li><ul><li><p>◆xxx</p></li><li><p>yyy</p></li></ul></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<ul><li><p>toto</p></li><li><p>◆xxx</p></li><li class="o_indent"><ul><li><p>yyy</p></li></ul></li><li><p>tutu</p></li></ul>',
        },
        {
            name: "in second li > p: BACKSPACE at start",
            content: "<ul><li><p>toto</p></li><li><p>◆xxx</p></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>toto◆xxx</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in second li > p (p after, within li): BACKSPACE at start",
            content: "<ul><li><p>toto</p></li><li><p>◆xxx</p><p>yyy</p></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>toto◆xxx</p><p>yyy</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in li > second-p: BACKSPACE at start",
            content: "<ul><li><p>toto</p></li><li><p>xxx</p><p>◆yyy</p></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>toto</p></li><li><p>xxx◆yyy</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in li (li after): BACKSPACE at start, with spaces",
            content: "<p>abc&nbsp;</p><ul><li><p>&nbsp; ◆def</p></li><li><p>dom not to edit</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<p>abc&nbsp;◆def</p><ul><li><p>dom not to edit</p></li></ul>",
            // todo: handle remove nbsp (not handled because no change triggered in "abc&nbsp;" so no rules applied)
        },
        {
            name: "in li > p: BACKSPACE after single character",
            content: "<ul><li><p>a◆</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>▶<br/>◀</p></li></ul>",
        },
        {
            name: "in li > p: BACKSPACE -> 'a' after single character",
            content: "<ul><li><p>a◆</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<ul><li><p>a◆</p></li></ul>",
        },
        {
            name: "in li > p > b: BACKSPACE on whole b",
            content: "<ul><li><p>a<b>▶bcd◀</b>e</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><p>a◆e</p></li></ul>",
        },
        {
            name: "in li (two empty li's before): BACKSPACE at start",
            content: "<ul><li><br/></li><li><br/></li><li>◆kl</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ul><li><br/></li><li>◆kl</li></ul>",
        },
        {
            name: "in ul > li (ol > li before): BACKSPACE at end",
            content: "<ol><li>a</li></ol><ul><li>◆b</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ol><li>a◆b</li></ol>",
        },
        {
            name: "in ul > li > p (ol > li before): BACKSPACE at end",
            content: "<ol><li>a</li></ol><ul><li><p>◆b</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ol><li>a◆b</li></ol>",
        },
        {
            name: "in ul > li (ol > li > p before): BACKSPACE at end",
            content: "<ol><li><p>a</p></li></ol><ul><li>◆b</li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ol><li><p>a◆b</p></li></ol>",
        },
        {
            name: "in ul > li > p (ol > li > p before): BACKSPACE at end",
            content: "<ol><li><p>a</p></li></ol><ul><li><p>◆b</p></li></ul>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<ol><li><p>a◆b</p></li></ol>",
        },

        // end list UL / OL

        {
            name: "in p: BACKSPACE on selection of all contents",
            content: "<p>▶dom to edit◀</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>▶<br/>◀</p>",
        },
        {
            name: "in p: BACKSPACE -> 'a' on selection of all contents",
            content: "<p>▶dom to edit◀</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: "<p>a◆</p>",
        },
        {
            name: "in complex-dom: BACKSPACE on selection of most contents",
            content: "<p><b>do▶m</b></p><p><b>to<br>partially</b>re<i>m◀</i>ove</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><b>do◆</b>ove</p>",
        },
        {
            name: "in complex-dom: BACKSPACE on selection of all contents",
            content: "<p><b>▶dom</b></p><p><b>to<br>completely</b>remov<i>e◀</i></p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><b>▶<br/>◀</b></p>",
        },
        {
            name: "in p: BACKSPACE after br",
            content: "<p>dom <br>◆to edit</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p>dom ◆to edit</p>",
        },
        {
            name: "in complex-dom (span > b -> ENTER in contents): BACKSPACE",
            content: "<p><span><b>dom<br></b></span><br><span><b>◆&nbsp;to edit</b></span></p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<p><span><b>dom<br/>◆&nbsp;to edit</b></span></p>",
        },
        {
            name: "in complex-dom (span > b -> ENTER in contents): 2 x BACKSPACE",
            content: "<p><span><b>dom<br></b></span><br><span><b>a◆ to edit</b></span></p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<p><span><b>dom<br/>◆&nbsp;to edit</b></span></p>",
        },
        {
            name: "in p (hr before): BACKSPACE",
            content: '<p>aaa</p><hr><p>◆bbb</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>aaa</p><p>◆bbb</p>',
        },
        // BR
        {
            name: "BR backspace test 1",
            content: '<p>dom to</p><p>◆<br><br><br><br></p><p>edit</p>', // is on BR1
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to◆<br/><br/><br/><br/></p><p>edit</p>',
        },
        {
            name: "BR backspace test 2-1",
            content: '<p>dom to</p><p><br>◆<br><br><br></p><p>edit</p>', // is on BR2
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to</p><p>▶<br/>◀<br/><br/></p><p>edit</p>', // is on BR2
        },
        {
            name: "BR backspace test 2-2",
            content: '<p>dom to</p><p><br>◆<br><br><br></p><p>edit</p>', // is on BR2
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to◆<br/><br/><br/></p><p>edit</p>',
        },
        {
            name: "BR backspace test 3-1",
            content: '<p>dom to</p><p><br><br>◆<br><br></p><p>edit</p>', // is on BR3
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to</p><p><br/>▶<br/>◀<br/></p><p>edit</p>', // is on BR3
        },
        {
            name: "BR backspace test 3-2",
            content: '<p>dom to</p><p><br><br>◆<br><br></p><p>edit</p>', // is on BR3
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p>▶<br/>◀<br/></p><p>edit</p>', // is on BR2
        },
        {
            name: "BR backspace test 3-3",
            content: '<p>dom to</p><p><br><br>◆<br><br></p><p>edit</p>', // is on BR3
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to◆<br/><br/></p><p>edit</p>',
        },
        {
            name: "BR backspace test 4-1",
            content: '<p>dom to</p><p><br><br><br>◆<br></p><p>edit</p>', // is on BR4
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to</p><p><br/><br/>▶<br/>◀</p><p>edit</p>', // is on BR3
        },
        {
            name: "BR backspace test 4-2",
            content: '<p>dom to</p><p><br><br><br>◆<br></p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p><br/>▶<br/>◀</p><p>edit</p>', // is on BR2
        },
        {
            name: "BR backspace test 4-3",
            content: '<p>dom to</p><p><br><br><br>◆<br></p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p>▶<br/>◀</p><p>edit</p>', // is on BR1
        },
        {
            name: "BR backspace test 4-4",
            content: '<p>dom to</p><p><br><br><br>◆<br></p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(4), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to◆</p><p>edit</p>',
        },
        {
            name: "BR backspace test 5-1",
            content: '<p>dom to</p><p><br><br><br><br>◆</p><p>edit</p>', // is on BR4
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to</p><p><br/><br/>▶<br/>◀</p><p>edit</p>', // should be identical to BR backspace test 4-1
        },
        {
            name: "BR backspace test 5-2",
            content: '<p>dom to</p><p><br><br><br><br>◆</p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p><br/>▶<br/>◀</p><p>edit</p>', // should be identical to BR backspace test 4-2
        },
        {
            name: "BR backspace test 5-3",
            content: '<p>dom to</p><p><br><br><br><br>◆</p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p>▶<br/>◀</p><p>edit</p>', // should be identical to BR backspace test 4-3
        },
        {
            name: "BR backspace test 5-4",
            content: '<p>dom to</p><p><br><br><br><br>◆</p><p>edit</p>', // is on BR4
            steps: Array.from(new Array(4), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to◆</p><p>edit</p>', // should be identical to BR backspace test 4-4
        },
        {
            name: "BR backspace test 6-1",
            content: '<p>dom to</p><p><br><br><br><br></p><p>◆edit</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>dom to</p><p><br/><br/><br/>◆edit</p>',
        },
        {
            name: "BR backspace test 6-2",
            content: '<p>dom to</p><p><br><br><br><br></p><p>◆edit</p>',
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p><br/><br/>◆edit</p>',
        },
        {
            name: "BR backspace test 6-3",
            content: '<p>dom to</p><p><br><br><br><br></p><p>◆edit</p>',
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p><br/>◆edit</p>',
        },
        {
            name: "BR backspace test 6-4",
            content: '<p>dom to</p><p><br><br><br><br></p><p>◆edit</p>',
            steps: Array.from(new Array(4), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to</p><p>◆edit</p>',
        },
        {
            name: "BR backspace test 6-5",
            content: '<p>dom to</p><p><br><br><br><br></p><p>◆edit</p>',
            steps: Array.from(new Array(5), function () {
                return {
                    key: 'BACKSPACE',
                };
            }),
            test: '<p>dom to◆edit</p>',
        },

        // table

        {
            name: "in empty-td (td before): BACKSPACE -> 'a' at start",
            content: '<table class="table table-bordered"><tbody><tr><td><p><br></p></td><td><p><br>◆</p></td></tr></tbody></table>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p><br/></p></td><td><p>a◆</p></td></tr></tbody></table>',
        },
        {
            name: "in td (td before): 2x BACKSPACE -> 'a' after first character",
            content: '<table class="table table-bordered"><tbody><tr><td><p>dom not to edit</p></td><td><p>d◆om to edit</p></td></tr></tbody></table>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p>dom not to edit</p></td><td><p>a◆om to edit</p></td></tr></tbody></table>',
        },
        {
            name: "in td (no other td): BACKSPACE within text",
            content: '<table class="table table-bordered"><tbody><tr><td><p>dom t◆o edit</p></td></tr></tbody></table>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p>dom ◆o edit</p></td></tr></tbody></table>',
        },
        {
            name: "in complex-dom (empty-td (td before) -> 2x SHIFT-ENTER): 3x BACKSPACE -> 'a'",
            content: '<table class="table table-bordered"><tbody><tr><td><p>dom not to edit</p></td><td><p><br><br><br>◆</p></td></tr></tbody></table>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p>dom not to edit</p></td><td><p>a◆</p></td></tr></tbody></table>',
        },
        {
            name: "in h1: BACKSPACE on full selection -> 'a'",
            content: '<h1>▶dom to delete◀</h1>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: '<h1>a◆</h1>',
        },
        {
            name: "in h1: BACKSPACE on full selection -> BACKSPACE -> 'a'",
            content: '<h1>▶dom to delete◀</h1>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }, {
                key: 'a',
            }],
            test: '<h1>a◆</h1>',
        },
        {
            name: "in h1: BACKSPACE on full selection -> DELETE -> 'a'",
            content: '<h1>▶dom to delete◀</h1>',
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: '<h1>a◆</h1>',
        },

        // merging non-similar blocks

        {
            name: "in p (h1 before): BACKSPACE at start",
            content: '<h1>node to merge with</h1><p>◆node to merge</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<h1>node to merge with◆node to merge</h1>',
        },
        {
            name: "in empty-p (h1 before): BACKSPACE",
            content: "<h1>dom to edit</h1><p><br>◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }],
            test: "<h1>dom to edit◆</h1>",
        },
        {
            name: "in empty-p (h1 before): 2x BACKSPACE",
            content: "<h1>dom to edit</h1><p><br>◆</p>",
            steps: [{
                key: 'BACKSPACE',
            }, {
                key: 'BACKSPACE',
            }],
            test: "<h1>dom to edi◆</h1>",
        },
        {
            name: "in p (ul before): BACKSPACE at start",
            content: '<ul><li><p>node to merge with</p></li></ul><p>◆node to merge</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<ul><li><p>node to merge with◆node to merge</p></li></ul>',
        },
        {
            name: "in p > b (ul before, i after): BACKSPACE at start",
            content: '<ul><li><p>node to merge with</p></li></ul><p><b>◆node</b><i>to merge</i></p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<ul><li><p>node to merge with<b>◆node</b><i>to merge</i></p></li></ul>',
        },
        {
            name: "in p > b (ul > i before, i after): BACKSPACE at start",
            content: '<ul><li><p><i>node to merge with</i></p></li></ul><p><b>◆node</b><i>to merge</i></p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<ul><li><p><i>node to merge with</i><b>◆node</b><i>to merge</i></p></li></ul>',
        },
        {
            name: "in p.c (p.a > span.b before - span.b after): BACKSPACE at beginning",
            content: '<p class="a"><span class="b">dom to</span></p><p class="c"><span class="b">◆edit</span></p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p class="a"><span class="b">dom to◆edit</span></p>',
        },
        {
            name: "from h1 to p: BACKSPACE",
            content: '<h1>node ▶to merge with</h1><p>no◀de to merge</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<h1>node ◆de to merge</h1>',
        },
        {
            name: "from h1 to p: BACKSPACE from start",
            content: '<h1><b>▶node to merge with</b></h1><p>no◀de to merge</p>',
            steps: [{
                key: 'BACKSPACE',
            }],
            test: '<p>◆de to merge</p>',
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

we3.addPlugin('TestKeyboardBackspace', TestKeyboardBackspace);

})();
