(function () {
'use strict';

var TestKeyboardDelete = class extends we3.AbstractPlugin {
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
            name: "in empty-p (no br): DELETE (must insert br)",
            content: "<p>◆</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>▶<br/>◀</p>",
        },
        {
            name: "in empty-p: DELETE (must leave it unchanged)",
            content: "<p><br/>◆</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>▶<br/>◀</p>",
        },
        {
            name: "in empty-p (p after): DELETE",
            content: "<p><br/>◆</p><p>dom to edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>◆dom to edit</p>",
        },
        {
            name: "in empty-p.a (p after): DELETE",
            content: '<p class="a"><br/>◆</p><p>dom to edit</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p class="a">◆dom to edit</p>',
        },
        {
            name: "in empty-p.a (p after): DELETE (2)",
            content: '<p class="a"><br/>◆</p><p>dom to edit</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p class="a">◆dom to edit</p>',
        },
        {
            name: "in p: DELETE at start",
            content: "<p>◆dom to edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>◆om to edit</p>",
        },
        {
            name: "in p: 2x DELETE at start",
            content: "<p>◆dom to edit</p>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }],
            test: "<p>◆m to edit</p>",
        },
        {
            name: "in p: DELETE within text",
            content: "<p>dom t◆o edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>dom t◆ edit</p>",
        },
        {
            name: "in p: DELETE -> 'a' within text, before \\w\\s",
            content: "<p>do◆m t</p>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<p>doa◆ t</p>",
        },
        {
            name: "in pre: DELETE within text, with space at beginning",
            content: "<pre>     dom t◆o edit</pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre>     dom t◆ edit</pre>",
        },
        {
            name: "in pre: DELETE within text, with one space at beginning",
            content: "<pre> dom t◆o edit</pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre> dom t◆ edit</pre>",
        },
        {
            name: "in pre: DELETE within text, with space at end",
            content: "<pre>dom t◆o edit     </pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre>dom t◆ edit     </pre>",
        },
        {
            name: "in pre: DELETE within text, with one space at end",
            content: "<pre>dom t◆o edit </pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre>dom t◆ edit </pre>",
        },
        {
            name: "in pre: DELETE within text, with space at beginning and end",
            content: "<pre>     dom t◆o edit     </pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre>     dom t◆ edit     </pre>",
        },
        {
            name: "in pre: DELETE within text, with one space at beginning and one at end",
            content: "<pre> dom t◆o edit </pre>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<pre> dom t◆ edit </pre>",
        },

        // list UL / OL

        {
            name: "in empty-li (no other li): DELETE (must do nothing)",
            content: "<ul><li><br/>◆</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>▶<br/>◀</li></ul>",
        },
        {
            name: "from p to li > p: DELETE on whole list",
            content: "<p>dom not to edit▶</p><ul><li><p>dom to edit◀</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>dom not to edit◆</p>",
        },
        {
            name: "in empty-li (no other li): DELETE -> 'a' (must write into it)",
            content: "<ul><li><br/>◆</li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<ul><li>a◆</li></ul>",
        },
        {
            name: "in li (li after): DELETE at end (must move contents of second li to carret)",
            content: "<ul><li>dom to&nbsp;◆</li><li>edit</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>dom to ◆edit</li></ul>",
        },
        {
            name: "in li (li after): DELETE -> 'a' at end (must move contents of second li to carret, then write)",
            content: "<ul><li>dom to&nbsp;◆</li><li>edit</li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<ul><li>dom to a◆edit</li></ul>",
        },
        {
            name: "in li > p: DELETE before single character",
            content: "<ul><li><p>◆a</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li><p>▶<br/>◀</p></li></ul>",
        },
        {
            name: "in li > p: DELETE -> 'a' before single character",
            content: "<ul><li><p>◆a</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<ul><li><p>a◆</p></li></ul>",
        },
        {
            name: "in li > p (p after): DELETE at end",
            content: "<ul><li><p>toto</p></li><li><p>xxx◆</p><p>yyy</p></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li><p>toto</p></li><li><p>xxx◆yyy</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in li > p (b before - p after): DELETE at end",
            content: "<ul><li><p>toto</p></li><li><p><b>x</b>xx◆</p><p><b>y</b>yy</p></li><li><p>tutu</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li><p>toto</p></li><li><p><b>x</b>xx◆<b>y</b>yy</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in li > p (p.o_default_snippet_text after): DELETE at end",
            content: '<ul><li><p>toto</p></li><li><p>xxx◆</p><p class="o_default_snippet_text">yyy</p></li><li><p>tutu</p></li></ul>',
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li><p>toto</p></li><li><p>xxx◆yyy</p></li><li><p>tutu</p></li></ul>",
        },
        {
            name: "in indented-ul > li: DELETE at end (must do nothing)",
            content: "<ul><li><ul><li>dom to edit◆</li></ul></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: '<ul><li class="o_indent"><ul><li>dom to edit◆</li></ul></li></ul>',
        },
        {
            name: "in indented-ul > li: DELETE at end -> 'a' at end (must write)",
            content: "<ul><li><ul><li>dom to edit◆</li></ul></li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: '<ul><li class="o_indent"><ul><li>dom to edita◆</li></ul></li></ul>',
        },
        {
            name: "in indented-ul > li (non-indented-li after): DELETE at end",
            content: "<ul><li><ul><li>dom to edit◆</li></ul></li><li>dom to edit</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: '<ul><li class="o_indent"><ul><li>dom to edit◆dom to edit</li></ul></li></ul>',
        },
        {
            name: "in ul > li (indented-li after): DELETE at end",
            content: "<ul><li>dom to edit◆</li><li><ul><li>dom to edit</li></ul></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>dom to edit◆dom to edit</li></ul>",
        },
        {
            name: "in li: DELETE on partial selection",
            content: "<ul><li>d▶om to ◀edit</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>d◆edit</li></ul>",
        },
        {
            name: "across 2 li: DELETE on partial selection",
            content: "<ul><li>d▶om to edit</li><li>dom to ◀edit</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>d◆edit</li></ul>",
        },
        {
            name: "in li: DELETE on selection of all contents",
            content: "<ul><li>▶dom to edit◀</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>▶<br/>◀</li></ul>",
        },
        {
            name: "in li: DELETE -> 'a' on selection of all contents",
            content: "<ul><li>▶dom to edit◀</li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<ul><li>a◆</li></ul>",
        },
        {
            name: "in li: DELETE after character, before p",
            content: "<ul><li>a</li><li>b◆<p>c</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ul><li>a</li><li><p>b◆c</p></li></ul>",
        },
        {
            name: "in ol > li (ul > li after): DELETE at end",
            content: "<ol><li>a◆</li></ol><ul><li>b</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ol><li>a◆b</li></ol>",
        },
        {
            name: "in ol > li (ul > li > p after): DELETE at end",
            content: "<ol><li>a◆</li></ol><ul><li><p>b</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ol><li>a◆b</li></ol>",
        },
        {
            name: "in ol > li > p (ul > li after): DELETE at end",
            content: "<ol><li><p>a◆</p></li></ol><ul><li>b</li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ol><li><p>a◆b</p></li></ol>",
        },
        {
            name: "in ol > li > p (ul > li > p after): DELETE at end",
            content: "<ol><li><p>a◆</p></li></ol><ul><li><p>b</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<ol><li><p>a◆b</p></li></ol>",
        },

        // end list UL / OL

        {
            name: "in p (b before): DELETE",
            content: "<p><b>dom◆</b>to edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p><b>dom◆</b>o edit</p>",
        },
        {
            name: "in p > span.a (div > span.a after): DELETE at end (must do nothing)",
            content: '<p><span class="a">dom to◆</span></p><div><span class="a">edit</span></div>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p><span class="a">dom to◆</span></p><div><span class="a">edit</span></div>',
        },
        {
            name: "in p: DELETE on partial selection",
            content: "<p>d▶om to ◀edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>d◆edit</p>",
        },
        {
            name: "across 2 p: DELETE on partial selection",
            content: "<p>d▶om</p><p>to ◀edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>d◆edit</p>",
        },
        {
            name: "in p: DELETE on selection of all contents",
            content: "<p>▶dom to edit◀</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>▶<br/>◀</p>",
        },
        {
            name: "in p: DELETE -> 'a' on selection of all contents",
            content: "<p>▶dom to edit◀</p>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: "<p>a◆</p>",
        },
        {
            name: "in p: DELETE before br",
            content: "<p>dom ◆<br/>to edit</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p>dom ◆to edit</p>",
        },
        {
            name: "in complex-dom: DELETE on selection of most contents",
            content: "<p><b>do▶m</b></p><p><b>to<br/>partially</b>re<i>m◀</i>ove</p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p><b>do◆</b>ove</p>",
        },
        {
            name: "in complex-dom: DELETE on selection of all contents",
            content: "<p><b>▶dom</b></p><p><b>to<br/>completely</b>remov<i>e◀</i></p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p><b>▶<br/>◀</b></p>",
        },
        {
            name: "in complex-dom (span > b -> ENTER): DELETE",
            content: "<p><span><b>dom◆</b></span><br/><span><b>to edit</b></span></p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p><span><b>dom◆to edit</b></span></p>",
        },
        {
            name: "in p (span.fa after): DELETE",
            content: '<p>aaa◆<span class="fa fa-star"></span>bbb</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>aaa◆bbb</p>',
        },
        {
            name: "in p (hr after): DELETE",
            content: '<p>aaa◆</p><hr><p>bbb</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>aaa◆</p><p>bbb</p>',
        },

        // table

        {
            name: "in empty-td (td after): DELETE -> 'a' at start",
            content: '<table class="table table-bordered"><tbody><tr><td><p><br/></p></td><td><p><br/>◆</p></td></tr></tbody></table>',
            steps: [{
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p><br/></p></td><td><p>a◆</p></td></tr></tbody></table>',
        },
        {
            name: "in td (td after): 2x DELETE -> 'a' after first character",
            content: '<table class="table table-bordered"><tbody><tr><td><p>d◆om to edit</p></td><td><p>dom not to edit</p></td></tr></tbody></table>',
            steps: [{
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }, {
                key: 'a',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p>da◆ to edit</p></td><td><p>dom not to edit</p></td></tr></tbody></table>',
        },
        {
            name: "in td: DELETE within text",
            content: '<table class="table table-bordered"><tbody><tr><td><p>dom ◆to edit</p></td></tr></tbody></table>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<table class="table table-bordered"><tbody><tr><td><p>dom ◆o edit</p></td></tr></tbody></table>',
        },

        // BR
        {
            name: "BR delete test 1",
            content: '<p>dom to</p><p><br><br><br><br>◆</p><p>edit</p>', // is on BR4
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to</p><p><br/><br/><br/>◆edit</p>',
        },
        {
            name: "BR delete test 2-1",
            content: '<p>dom to</p><p><br><br><br>◆<br></p><p>edit</p>', // is on BR4
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to</p><p><br/><br/><br/>◆edit</p>', // should be identical to BR delete test 1
        },
        {
            name: "BR delete test 3-1",
            content: '<p>dom to</p><p><br><br>◆<br><br></p><p>edit</p>', // is on BR3
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to</p><p><br/><br/>▶<br/>◀</p><p>edit</p>', // is on BR3
        },
        {
            name: "BR delete test 3-2",
            content: '<p>dom to</p><p><br><br>◆<br><br></p><p>edit</p>', // is on BR2
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p><br/><br/>◆edit</p>',
        },
        {
            name: "BR delete test 4-1",
            content: '<p>dom to</p><p><br>◆<br><br><br></p><p>edit</p>', // is on BR2
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to</p><p><br/>▶<br/>◀<br/></p><p>edit</p>', // is on BR3
        },
        {
            name: "BR delete test 4-2",
            content: '<p>dom to</p><p><br>◆<br><br><br></p><p>edit</p>', // is on BR2
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p><br/>▶<br/>◀</p><p>edit</p>', // is on BR2
        },
        {
            name: "BR delete test 4-3",
            content: '<p>dom to</p><p><br>◆<br><br><br></p><p>edit</p>', // is on BR2
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p><br/>◆edit</p>',
        },
        {
            name: "BR delete test 5-1",
            content: '<p>dom to</p><p>◆<br><br><br><br></p><p>edit</p>', // is on BR1
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to</p><p>▶<br/>◀<br/><br/></p><p>edit</p>', // is on BR2
        },
        {
            name: "BR delete test 5-2",
            content: '<p>dom to</p><p>◆<br><br><br><br></p><p>edit</p>', // is on BR1
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p>▶<br/>◀<br/></p><p>edit</p>', // is on BR2
        },
        {
            name: "BR delete test 5-3",
            content: '<p>dom to</p><p>◆<br><br><br><br></p><p>edit</p>', // is on BR1
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p>▶<br/>◀</p><p>edit</p>',
        },
        {
            name: "BR delete test 5-4",
            content: '<p>dom to</p><p>◆<br><br><br><br></p><p>edit</p>', // is on BR1
            steps: Array.from(new Array(4), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to</p><p>◆edit</p>',
        },
        {
            name: "BR delete test 6-1",
            content: '<p>dom to◆</p><p><br><br><br><br></p><p>edit</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<p>dom to◆<br/><br/><br/><br/></p><p>edit</p>',
        },
        {
            name: "BR delete test 6-2",
            content: '<p>dom to◆</p><p><br><br><br><br></p><p>edit</p>',
            steps: Array.from(new Array(2), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to◆<br/><br/><br/></p><p>edit</p>',
        },
        {
            name: "BR delete test 6-3",
            content: '<p>dom to◆</p><p><br><br><br><br></p><p>edit</p>',
            steps: Array.from(new Array(3), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to◆<br/><br/></p><p>edit</p>',
        },
        {
            name: "BR delete test 6-4",
            content: '<p>dom to◆</p><p><br><br><br><br></p><p>edit</p>',
            steps: Array.from(new Array(4), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to◆</p><p>edit</p>',
        },
        {
            name: "BR delete test 6-5",
            content: '<p>dom to◆</p><p><br><br><br><br></p><p>edit</p>',
            steps: Array.from(new Array(5), function () {
                return {
                    key: 'DELETE',
                };
            }),
            test: '<p>dom to◆edit</p>',
        },

        // merging non-similar blocks

        {
            name: "in p (ul after): DELETE at end (must bring contents of first li to end of p)",
            content: "<p>dom to edit◆&nbsp;</p><ul><li><p>&nbsp; dom to edit</p></li><li><p>dom not to edit</p></li></ul>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }],
            test: "<p>dom to edit◆dom to edit</p><ul><li><p>dom not to edit</p></li></ul>",
        },
        {
            name: "in h1 (p after): DELETE at end",
            content: '<h1>node to merge with◆</h1><p>node to merge</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<h1>node to merge with◆node to merge</h1>',
        },
        {
            name: "in h1 (empty-p after): DELETE at end",
            content: "<h1>dom to edit◆</h1><p><br/></p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<h1>dom to edit◆</h1>",
        },
        {
            name: "in h1 (empty-p after): 2x DELETE at end",
            content: "<h1>dom to edit◆</h1><p><br/></p>",
            steps: [{
                key: 'DELETE',
            }, {
                key: 'DELETE',
            }],
            test: "<h1>dom to edit◆</h1>",
        },
        {
            name: "in li > p (p after ul): DELETE at end",
            content: '<ul><li><p>node to merge with◆</p></li></ul><p>node to merge</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<ul><li><p>node to merge with◆node to merge</p></li></ul>',
        },
        {
            name: "in li > p (i before - p > b after): DELETE at end",
            content: '<ul><li><p><i>node to merge</i> with◆</p></li></ul><p><b>node</b> to merge</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<ul><li><p><i>node to merge</i> with◆<b>node</b> to merge</p></li></ul>',
        },
        {
            name: "in li > p > i (b before - p > b after): DELETE at end",
            content: '<ul><li><p><b>node to </b><i>merge with◆</i></p></li></ul><p><b>node</b> to merge</p>',
            steps: [{
                key: 'DELETE',
            }],
            test: '<ul><li><p><b>node to </b><i>merge with◆</i><b>node</b> to merge</p></li></ul>',
        },
        {
            name: "in p.a > span.b (p.c > span.b after): DELETE at end",
            content: "<p class=\"a\"><span class=\"b\">dom to&nbsp;◆</span></p><p class=\"c\"><span class=\"b\">edit</span></p>",
            steps: [{
                key: 'DELETE',
            }],
            test: "<p class=\"a\"><span class=\"b\">dom to ◆edit</span></p>",
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

we3.addPlugin('TestKeyboardDelete', TestKeyboardDelete);

})();
