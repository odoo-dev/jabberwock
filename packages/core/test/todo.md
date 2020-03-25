# Tests from we3 to check
When implementing the tests for the delete, backspace and enter keys, certain tests from we3 had to be skipped. Please check these whenever a new feature is implemented, and convert the tests that have become relevant thanks to your feature, if any.

1. [Delete (`deleteForward`)](#forward)
    1. [Skipped](#f-skipped)
        1. [Two function calls -> redundant](#f-s-tfc)
        2. [Multiple block contexts within a list item](#f-s-li)
    2. [To convert later](#f-todo)
        1. [Unbreakable](#f-t-unbreakable)
        2. [Tables](#f-t-tables)
        3. [HR](#f-t-hr)
        4. [Integration](#f-t-integration)
2. [Backspace (`deleteBackward`)](#backward)
    1. [Skipped](#b-skipped)
        1. [Two function calls -> redundant](#b-s-tfc)
        2. [Multiple block contexts within a list item](#b-s-li)
        3. [Whitespace, format](#b-s-wsf)
        4. [Different spec?](#b-s-spec)
    2. [To convert later](#b-todo)
        1. [Tables](#b-t-tables)
        2. [HR](#b-t-hr)
        3. [Integration](#b-t-integration)
3. [Enter (`insertParagraphBreak`)](#enter)
    1. [To convert later](#e-todo)
        1. [Buttons](#e-t-buttons)
        2. [Integration](#e-t-integration)
4. [List (`toggleList`)](#list)
    1. [Skipped](#l-skipped)
    2. [To convert later](#l-todo)
        1. [Unbreakable](#l-t-unbreakable)
        2. [Table](#l-t-table)
        3. [Checklists](#l-t-checklists)
        4. [Indent](#l-t-indent)

## Delete (`deleteForward`)<a name="forward"></a>
Note: These were tests for the delete key in we3. When implementing one, always make sure to also implement its inverse in backward tests.

### Skipped<a name="f-skipped"></a>

#### Two function calls -> redundant<a name="f-s-tfc"></a>
```javascript
{
    name: "in p: DELETE within text",
    content: "<p>dom t◆o edit</p>",
    steps: [{
        key: 'DELETE',
    }],
    test: "<p>dom t◆ edit</p>",
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
```

#### Multiple block contexts within a list item<a name="f-s-li">
```javascript
{
    name: "in li: DELETE after character, before p",
    content: "<ul><li>a</li><li>b◆<p>c</p></li></ul>",
    steps: [{
        key: 'DELETE',
    }],
    test: "<ul><li>a</li><li><p>b◆c</p></li></ul>",
},
{
    name: "in li > p (p.o_default_snippet_text after): DELETE at end",
    content: '<ul><li><p>toto</p></li><li><p>xxx◆</p><p class="o_default_snippet_text">yyy</p></li><li><p>tutu</p></li></ul>',
    steps: [{
        key: 'DELETE',
    }],
    test: "<ul><li><p>toto</p></li><li><p>xxx◆yyy</p></li><li><p>tutu</p></li></ul>",
},
```

### To convert later<a name="f-todo"></a>
(when their related feature is implemented)

#### Unbreakable<a name="f-t-unbreakable"></a>
```javascript
{
    name: "in p > span.a (div > span.a after): DELETE at end (must do nothing)",
    content: '<p><span class="a">dom to◆</span></p><div><span class="a">edit</span></div>',
    steps: [{
        key: 'DELETE',
    }],
    test: '<p><span class="a">dom to◆</span></p><div><span class="a">edit</span></div>',
},
```

#### Tables<a name="f-t-tables"></a>
```javascript
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
```

#### HR<a name="f-t-hr"></a>
```javascript
{
    name: "in p (hr after): DELETE",
    content: '<p>aaa◆</p><hr><p>bbb</p>',
    steps: [{
        key: 'DELETE',
    }],
    test: '<p>aaa◆</p><p>bbb</p>',
},
```

#### Integration<a name="f-t-integration"></a>
```javascript
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
    name: "in li: DELETE -> 'a' on selection of all contents",
    content: "<ul><li>▶dom to edit◀</li></ul>",
    steps: [{
        key: 'DELETE',
    }, {
        key: 'a',
    }],
    test: "<ul><li>a◆</li></ul>",
},
```

## Backspace (`deleteBackward`)<a name="backward"></a>
Note: These were tests for the backspace key in we3. When implementing one,
always make sure to also implement its inverse in forward tests.

### Skipped<a name="b-skipped"></a>

#### Two function calls -> redundant<a name="b-s-tfc"></a>
```javascript
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
    name: "in empty-p (h1 before): 2x BACKSPACE",
    content: "<h1>dom to edit</h1><p><br>◆</p>",
    steps: [{
        key: 'BACKSPACE',
    }, {
        key: 'BACKSPACE',
    }],
    test: "<h1>dom to edi◆</h1>",
},
```

#### Multiple block contexts within a list item<a name="b-s-li">
```javascript
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
    name: "in p (div > span.a before - span.a after): BACKSPACE at beginning (must do nothing)",
    content: "<div><p><span class=\"a\">dom to&nbsp;</span></p></div><p><span class=\"a\">◆edit</span></p>",
    steps: [{
        key: 'BACKSPACE',
    }],
    test: "<div><p><span class=\"a\">dom to&nbsp;</span></p></div><p><span class=\"a\">◆edit</span></p>",
},
```

#### Whitespace, format<a name="b-s-wsf"></a>
```javascript
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
    name: "in li > p > b: BACKSPACE on whole b",
    content: "<ul><li><p>a<b>▶bcd◀</b>e</p></li></ul>",
    steps: [{
        key: 'BACKSPACE',
    }],
    test: "<ul><li><p>a◆e</p></li></ul>",
},
```

#### Different spec?<a name="b-s-spec"></a>
```javascript
{
    name: "in li (no other li - p before): BACKSPACE at start",
    content: "<p>toto</p><ul><li>◆&nbsp;<img src='/web_editor/static/src/img/transparent.png'></li></ul>",
    steps: [{
        key: 'BACKSPACE',
    }],
    test: "<p>toto</p><p>◆&nbsp;<img src=\"/web_editor/static/src/img/transparent.png\"/></p>",
},
```

### To convert later

#### Tables<a name="b-t-tables"></a>
```javascript
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
```

#### HR<a name="b-t-hr"></a>
```javascript
{
    name: "in p (hr before): BACKSPACE",
    content: '<p>aaa</p><hr><p>◆bbb</p>',
    steps: [{
        key: 'BACKSPACE',
    }],
    test: '<p>aaa</p><p>◆bbb</p>',
},
```

#### Integration<a name="b-t-integration"></a>
```javascript
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
    name: "in li > p: BACKSPACE -> 'a' after single character",
    content: "<ul><li><p>a◆</p></li></ul>",
    steps: [{
        key: 'BACKSPACE',
    }, {
        key: 'a',
    }],
    test: "<ul><li><p>a◆</p></li></ul>",
},
```

## Enter (`insertParagraphBreak`)<a name="enter"></a>

### To convert later<a name="e-todo"></a>
Note: The tests that are commented out were found as is in we3. They were either "todo" or "toremove"...

#### Buttons<a name="e-t-buttons"></a>
```javascript
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
```

#### Integration<a name="e-t-integration"></a>
```javascript
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
    name: "in p (other-p > span.a before - p > span.b after): SHIFT+ENTER -> 'a' at beginning",
    content: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\">edit</span></p>",
    steps: [{
        start: "p:eq(1):contents()[0]->0",
        key: 'ENTER',
        shiftKey: true,
    }, {
        key: 'a',
    }],
    test: "<p><span class=\"a\">dom to</span></p><p><span class=\"b\"><br/>aedit</span></p>",
        start: "span:eq(1):contents()[1]->1",
    },
},
it('should insert a line break within a span with bold then split their paragraph container in two', async () => {
    await testEditor(BasicEditor, {
        contentBefore: '<p><span><b>ab[]cd</b></span></p>',
        stepFunction: async (editor: JWEditor) => {
            await insertLineBreak(editor);
            await insertParagraphBreak(editor);
        },
        contentAfter:
            '<p><span><b>ab</b></span><br/><br/></p><p><span><b>[]cd</b></span></p>',
    });
});
{
    name: "in span > b: SHIFT+ENTER -> ENTER",
    content: "",
    steps: [{
        key: 'ENTER',
        shiftKey: true,
    }, {
        key: 'ENTER',
    }],
    test: "",
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
// {
//     name: "in span > b: SHIFT+ENTER -> 'a'",
//     content: "<span><b>dom◆ to edit</b></span>",
//     steps: [{
//         key: 'ENTER',
//         shiftKey: true,
//     }, {
//         key: 'a',
//     }],
//     test: "<p><span><b>dom<br/>a◆ to edit</b></span></p>",
// },
// {
//     name: "in span > b: SHIFT+ENTER -> ENTER -> 'a'",
//     content: "<span><b>dom◆ to edit</b></span>",
//     steps: [{
//         key: 'ENTER',
//         shiftKey: true,
//     }, {
//         key: 'ENTER',
//     }, {
//         key: 'a',
//     }],
//     test: "<p><span><b>dom<br/><br/></b></span></p><p><span><b>a◆ to edit</b></span></p>",
//     // the extra BR appeared to make the first one visible
// },
```

## List (`toggleList`)<a name="list"></a>
The following tests come from we3's `TestList.js`

### Skipped<a name="l-skipped"></a>
```javascript
{
    name: "Click OL after ENTER in p > b",
    content: "<p><b>dom to edit◆</b></p>",
    do: async function () {
        await self.dependencies.TestToolbar.keydown(13); // ENTER
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
        return self.dependencies.TestToolbar.keydown('a');
    },
    test: "<p><b>dom to edit</b></p><ol><li><p>a◆</p></li></ol>", // todo: see why it removes b
},
```

### To convert later<a name="l-todo"></a>
(when their related feature is implemented)

#### Unbreakable<a name="l-t-unbreakable"></a>
```typescript
it('should turn a paragraph in a div and a paragraph into a list with two items', async () => {
    await testEditor({
        contentBefore: '<div><p>ab[cd</p></div><p>ef]gh</p>',
        stepFunction: toggleUnorderedList,
        contentAfter: '<div><ul><li>ab[cd</li></ul></div><ul><li>ef]gh</li></ul>',
    });
});
```

#### Table<a name="l-t-table"></a>
```javascript
{
    name: "Click OL in empty table cell in div",
    content: '<div>' +
        '<p>a</p>' +
        '<table>' +
        '<tbody>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><br>◆</td>' +
        '<td><br></td>' +
        '</tr>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div>' +
            '<p>a</p>' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><ol><li>▶<br/>◀</li></ol></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</div>',
},
{
    name: "Click OL in empty table cell in div (2)",
    content: '<div>' +
        '<p>a</p>' +
        '<table>' +
        '<tbody>' +
        '<tr>' +
        '<td><br/></td>' +
        '<td><br/>◆</td>' +
        '<td><br/></td>' +
        '</tr>' +
        '<tr>' +
        '<td><br/></td>' +
        '<td><br/></td>' +
        '<td><br/></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div>' +
            '<p>a</p>' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><ol><li>▶<br/>◀</li></ol></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</div>',
},
{
    name: "Click OL in empty table cell in div (3)",
    content: '<div>' +
        '<p>a</p>' +
        '<table>' +
        '<tbody>' +
        '<tr>' +
        '<td><br/></td>' +
        '<td><br/>◆</td>' +
        '<td><br/></td>' +
        '</tr>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div>' +
            '<p>a</p>' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><ol><li>▶<br/>◀</li></ol></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</div>',
},
{
    name: "Click OL in table cell in div",
    content: '<div>' +
        '<p>a</p>' +
        '<table>' +
        '<tbody>' +
        '<tr>' +
        '<td><br></td>' +
        '<td>a◆aa</td>' +
        '<td><br></td>' +
        '</tr>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div>' +
            '<p>a</p>' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><ol><li>a◆aa</li></ol></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</div>',
},
{
    name: "Click OL on image in table cell in div",
    content: '<div>' +
        '<p>a</p>' +
        '<table>' +
        '<tbody>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><img data-src="/web_editor/static/src/img/transparent.png"></td>' +
        '<td><br></td>' +
        '</tr>' +
        '<tr>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '<td><br></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    do: async function () {
        await self.dependencies.Test.click(self.editable.querySelector('img'));
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div>' +
            '<p>a</p>' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><ol><li>▶<img data-src="/web_editor/static/src/img/transparent.png"/>◀</li></ol></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '<tr>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '<td><br/></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '</div>',
},
```

#### Font<a name="l-t-font"></a>
```javascript
{
    name: "Click OL in font in H1 (with link) in div",
    content: '<div><h1><font style="font-size: 62px;">table of co◆ntents <a href="p23">p23</a> (cfr: 34)</font></h1></div>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
    },
    test: '<div><ol><li><h1><font style="font-size:62px">table of co◆ntents <a href="p23">p23</a> (cfr: 34)</font></h1></li></ol></div>',
},
```

#### Checklists<a name="l-t-checklists"></a>
(+ equivalents of all current mixed tests with checklists)
```javascript
{
    name: "insert a checklist in an empty p",
    content: '<p><br/>◆</p>',
    do: async function () {
        await self.dependencies.Test.triggerNativeEvents(self.btnChecklist, ['mousedown', 'click']);
    },
    test: '<ul class="o_checklist"><li><p>▶<br/>◀</p></li></ul>',
},
{
    name: "check checkbox in checklist with children",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<li>' +
        '<ul class="o_checklist">' +
        '<li><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li><p>ddd</p></li>' +
        '</ul>' +
        '</li>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('li');
        await self.triggerMouseEventsWithOffsetX(lis[0], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>◆aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "check checkbox in checklist with children (2)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<ul class="o_checklist">' +
        '<li><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li><p>ddd</p></li>' +
        '</ul>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('li');
        await self.triggerMouseEventsWithOffsetX(lis[0], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>◆aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "uncheck checkbox in checklist with children",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>aaa</p></li>' +
        '<li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li class="o_checked"><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '</li>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('li');
        await self.triggerMouseEventsWithOffsetX(lis[0], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>◆aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li><p>bbb</p></li>' +
            '<li><p>ccc</p></li>' +
            '<li><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "uncheck checkbox in checklist with children (2)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>aaa</p></li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li class="o_checked"><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('li');
        await self.triggerMouseEventsWithOffsetX(lis[0], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>◆aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li><p>bbb</p></li>' +
            '<li><p>ccc</p></li>' +
            '<li><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "uncheck checkbox in checklist in checklist",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>aaa</p></li>' +
        '<li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li class="o_checked"><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '</li>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li><p>◆ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "uncheck checkbox in checklist in checklist (2)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>aaa</p></li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li class="o_checked"><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li><p>◆ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "check checkbox in checklist in checklist (3)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li><p>ddd</p></li>' +
        '</ul>' +
        '</li>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>◆ccc</p></li>' +
            '<li><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "check checkbox in checklist in checklist (4)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li><p>ddd</p></li>' +
        '</ul>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>◆ccc</p></li>' +
            '<li><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "check checkbox in checklist in checklist (full)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '</li>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>◆ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
{
    name: "check checkbox in checklist in checklist (full) (2)",
    content: '<p>x</p>' +
        '<ul class="o_checklist">' +
        '<li><p>aaa</p></li>' +
        '<ul class="o_checklist">' +
        '<li class="o_checked"><p>bbb</p></li>' +
        '<li><p>ccc</p></li>' +
        '<li class="o_checked"><p>ddd</p></li>' +
        '</ul>' +
        '<li><p>eee</p></li>' +
        '</ul>' +
        '<p>y</p>',
    do: async function () {
        var lis = self.editable.querySelectorAll('ul ul li');
        await self.triggerMouseEventsWithOffsetX(lis[1], -10, ['mousedown', 'click']);
    },
    test: '<p>x</p>' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>aaa</p></li>' +
            '<li class="o_indent">' +
            '<ul class="o_checklist">' +
            '<li class="o_checked"><p>bbb</p></li>' +
            '<li class="o_checked"><p>◆ccc</p></li>' +
            '<li class="o_checked"><p>ddd</p></li>' +
            '</ul>' +
            '</li>' +
            '<li><p>eee</p></li>' +
            '</ul>' +
            '<p>y</p>',
},
```
