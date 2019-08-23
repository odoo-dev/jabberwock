(function () {
'use strict';

var TestToolbarList = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestToolbar', 'List'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        this.triggerMouseEventsWithOffsetX = function (el, offsetX, eventNames) {
            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            var clientX = el.getBoundingClientRect().left + scrollLeft;
            self.dependencies.Test.triggerNativeEvents(el, eventNames, {
                clientX: clientX + offsetX,
            });
        };

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.ulTests = [
            {
                name: "Click UL: empty p -> ul",
                content: '<p><br/>◆</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<ul><li><p>▶<br/>◀</p></li></ul>',
            },
            {
                name: "Click UL: p -> ul",
                content: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: p -> ul (across paragraphs)",
                content: '<p>dom not to edit</p><p>d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ul -> p",
                content: '<p>dom not to edit</p><ul><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
            },
            {
                name: "Click UL: ul -> p (across li's)",
                content: '<p>dom not to edit</p><ul><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om to edit</p><p>dom t◀o edit</p>',
            },
            {
                name: "Click UL: ul -> p (from second li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li></ul><p>d▶om t◀o edit</p>',
            },
        ];
        this.olTests = [
            {
                name: "Click OL: p -> ol",
                content: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: p -> ol (across paragraphs)",
                content: '<p>dom not to edit</p><p>d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ol -> p",
                content: '<p>dom not to edit</p><ol><li><p>d▶om t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
            },
            {
                name: "Click OL: p -> ol (across li's)",
                content: '<p>dom not to edit</p><ol><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om to edit</p><p>dom t◀o edit</p>',
            },
            {
                name: "Click OL: ol -> p (from second li)",
                content: '<p>dom not to edit</p><ol><li><p>dom to edit</p></li><li><p>d▶om t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>dom to edit</p></li></ol><p>d▶om t◀o edit</p>',
            },
            {
                name: "Click OL: ol -> p (from second li) (no selection)",
                content: '<p>dom not to edit</p><ol><li><p>dom to edit</p></li><li><p>d◆om to edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>dom to edit</p></li></ol><p>d◆om to edit</p>',
            },
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
                    '<td>▶<img data-src="/web_editor/static/src/img/transparent.png">◀</td>' +
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
            {
                name: "Click OL with selected LI in OL",
                content: '<p>x</p>' +
                    '<ol>' +
                    '<li><p>aaa</p></li>' +
                    '<li><p>b▶bb</p></li>' +
                    '<li><p>c◀cc</p></li>' +
                    '<li><p>ddd</p></li>' +
                    '</ol>' +
                    '<p>y</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>x</p>' +
                        '<ol>' +
                        '<li><p>aaa</p></li>' +
                        '</ol>' +
                        '<p>b▶bb</p>' +
                        '<p>c◀cc</p>' +
                        '<ol>' +
                        '<li><p>ddd</p></li>' +
                        '</ol>' +
                        '<p>y</p>',
            },
            {
                name: "Click OL with selected LI in UL",
                content: '<p>x</p>' +
                    '<ul>' +
                    '<li><p>aaa</p></li>' +
                    '<li><p>b▶bb</p></li>' +
                    '<li><p>c◀cc</p></li>' +
                    '<li><p>ddd</p></li>' +
                    '</ul>' +
                    '<p>y</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>x</p>' +
                        '<ul>' +
                        '<li><p>aaa</p></li>' +
                        '</ul>' +
                        '<ol>' +
                        '<li><p>b▶bb</p></li>' +
                        '<li><p>c◀cc</p></li>' +
                        '</ol>' +
                        '<ul>' +
                        '<li><p>ddd</p></li>' +
                        '</ul>' +
                        '<p>y</p>',
            },
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
            {
                name: "Click OL in font in H1 (with link) in div",
                content: '<div><h1><font style="font-size: 62px;">table of co◆ntents <a href="p23">p23</a> (cfr: 34)</font></h1></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<div><ol><li><h1><font style="font-size:62px">table of co◆ntents <a href="p23">p23</a> (cfr: 34)</font></h1></li></ol></div>',
            },
        ];
        this.checklistTests = [
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
        ];
        this.conversionTests = [
            // OL -> UL
            {
                name: "Click UL: ol -> ul",
                content: '<p>dom not to edit</p><ol><li><p>d▶om t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ol -> ul (across li's)",
                content: '<p>dom not to edit</p><ol><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ol -> ul (from second li)",
                content: '<p>dom not to edit</p><ol><li><p>xxx</p></li><li><p>d▶om t◀o edit</p></li></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>xxx</p></li></ol><ul><li><p>d▶om t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ul ol -> ul ul (from indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ol><li><p>d▶om t◀o edit</p></li></ol></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul><li><p>d▶om t◀o edit</p></li></ul></li></ul>',
            },
            {
                name: "Click UL: ul ol -> ul ul (across several indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ol><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ol></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ul></li></ul>',
            },
            {
                name: "Click UL: ul ol -> ul ul (from second indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ol><li><p>dom not to edit</p></li><li><p>d▶om t◀o edit</p></li><li><p>dom not to edit</p></li></ol></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ol><li><p>dom not to edit</p></li></ol></li><li class="o_indent"><ul><li><p>d▶om t◀o edit</p></li></ul></li><li class="o_indent"><ol><li><p>dom not to edit</p></li></ol></li></ul>',
            },
            // Checklist -> UL
            {
                name: "Click UL: ul.o_checklist -> ul",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ul.o_checklist -> ul (across li's)",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ul.o_checklist -> ul (from second li)",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>xxx</p></li><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul class="o_checklist"><li><p>xxx</p></li></ul><ul><li><p>d▶om t◀o edit</p></li></ul>',
            },
            {
                name: "Click UL: ul ul.o_checklist -> ul ul (from indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ul class="o_checklist"><li><p>d▶om t◀o edit</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul><li><p>d▶om t◀o edit</p></li></ul></li></ul>',
            },
            {
                name: "Click UL: ul ul.o_checklist -> ul ul (across several indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ul class="o_checklist"><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ul></li></ul>',
            },
            {
                name: "Click UL: ul ul.o_checklist -> ul ul (from second indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ul class="o_checklist"><li><p>dom not to edit</p></li><li><p>d▶om t◀o edit</p></li><li><p>dom not to edit</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul class="o_checklist"><li><p>dom not to edit</p></li></ul></li><li class="o_indent"><ul><li><p>d▶om t◀o edit</p></li></ul></li><li class="o_indent"><ul class="o_checklist"><li><p>dom not to edit</p></li></ul></li></ul>',
            },
            // UL -> OL
            {
                name: "Click OL: ul -> ol",
                content: '<p>dom not to edit</p><ul><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ul -> ol (across li's)",
                content: '<p>dom not to edit</p><ul><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ul -> ol (from second li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li></ul><ol><li><p>d▶om t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ol ul -> ol ol (from indented li)",
                content: '<p>dom not to edit</p><ol><li><p>xxx</p></li><ul><li><p>d▶om t◀o edit</p></li></ul></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>xxx</p></li><li class="o_indent"><ol><li><p>d▶om t◀o edit</p></li></ol></li></ol>',
            },
            {
                name: "Click OL: ol ul -> ol ol (across several indented li)",
                content: '<p>dom not to edit</p><ol><li><p>xxx</p></li><ul><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ul></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>xxx</p></li><li class="o_indent"><ol><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ol></li></ol>',
            },
            {
                name: "Click OL: ol ul -> ol ol (from second indented li)",
                content: '<p>dom not to edit</p><ol><li><p>xxx</p></li><ul><li><p>dom not to edit</p></li><li><p>d▶om t◀o edit</p></li><li><p>dom not to edit</p></li></ul></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>xxx</p></li><li class="o_indent"><ul><li><p>dom not to edit</p></li></ul></li><li class="o_indent"><ol><li><p>d▶om t◀o edit</p></li></ol></li><li class="o_indent"><ul><li><p>dom not to edit</p></li></ul></li></ol>',
            },
            {
                name: "Click OL 2x: ul ul -> ul ol -> ul",
                content: '<p>a</p>' +
                    '<ul>' +
                    '<li><p>b</p></li>' +
                    '<ul>' +
                    '<li><p>c◆</p></li>' +
                    '<li><p>d</p></li>' +
                    '</ul>' +
                    '<li><p>e</p></li>' +
                    '</ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>a</p>' +
                    '<ul>' +
                    '<li><p>b</p></li>' +
                    '<li><p>c◆</p></li>' +
                    '<li class="o_indent"><ul>' +
                    '<li><p>d</p></li>' +
                    '</ul>' +
                    '</li>' +
                    '<li><p>e</p></li>' +
                    '</ul>',
            },
            {
                name: "Click OL: ul -> ol (from second (empty) li)",
                content: '<p>dom not to edit</p><ul><li><p>a</p></li><li>◆</li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>a</p></li></ul><ol><li>▶<br/>◀</li></ol>',
            },
            {
                name: "Click OL: ul -> ol (from second li > br)",
                content: '<p>dom not to edit</p><ul><li><p>a</p></li><li><br/>◆</li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>a</p></li></ul><ol><li>▶<br/>◀</li></ol>',
            },
            // Checklist -> OL
            {
                name: "Click OL: ul.o_checklist -> ol",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ul.o_checklist -> ol (across li's)",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>d▶om to edit</p></li><li><p>dom t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ul.o_checklist -> ol (from second li)",
                content: '<p>dom not to edit</p><ul class="o_checklist"><li><p>xxx</p></li><li><p>d▶om t◀o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul class="o_checklist"><li><p>xxx</p></li></ul><ol><li><p>d▶om t◀o edit</p></li></ol>',
            },
            {
                name: "Click OL: ol ul.o_checklist -> ol ol (from indented li)",
                content: '<p>dom not to edit</p><ol><li><p>xxx</p></li><ul class="o_checklist"><li><p>d▶om t◀o edit</p></li></ul></ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ol><li><p>xxx</p></li><li class="o_indent"><ol><li><p>d▶om t◀o edit</p></li></ol></li></ol>',
            },
            {
                name: "Click OL: ul ul.o_checklist -> ul ol (across several indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ul class="o_checklist"><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ol><li><p>d▶om to edit 1</p></li><li><p>dom t◀o edit 2</p></li></ol></li></ul>',
            },
            {
                name: "Click OL: ul ul.o_checklist -> ul ol (from second indented li)",
                content: '<p>dom not to edit</p><ul><li><p>xxx</p></li><ul class="o_checklist"><li><p>dom not to edit</p></li><li><p>d▶om t◀o edit</p></li><li><p>dom not to edit</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><ul><li><p>xxx</p></li><li class="o_indent"><ul class="o_checklist"><li><p>dom not to edit</p></li></ul></li><li class="o_indent"><ol><li><p>d▶om t◀o edit</p></li></ol></li><li class="o_indent"><ul class="o_checklist"><li><p>dom not to edit</p></li></ul></li></ul>',
            },
            // UL -> Checklist
            {
                name: "Click Checklist: 2 ul li ul li -> 2 ul li ul.o_checklist li",
                content: '<ul>' +
                            '<li>' +
                                '<p>1</p>' +
                            '</li>' +
                            '<li class="o_indent">' +
                                '<ul>' +
                                    '<li>' +
                                        '<p>2</p>' +
                                    '</li>' +
                                    '<li>' +
                                        '<p>▶3</p>' +
                                    '</li>' +
                                    '<li>' +
                                        '<p>4◀</p>' +
                                    '</li>' +
                                '</ul>' +
                            '</li>' +
                            '<li>' +
                                '<p>5</p>' +
                            '</li>' +
                        '</ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnChecklist, ['mousedown', 'click']);
                },
                test: '<ul>' +
                        '<li>' +
                            '<p>1</p>' +
                        '</li>' +
                        '<li class="o_indent">' +
                            '<ul>' +
                                '<li>' +
                                    '<p>2</p>' +
                                '</li>' +
                            '</ul>' +
                        '</li>' +
                        '<li class="o_indent">' +
                            '<ul class="o_checklist">' +
                                '<li>' +
                                    '<p>▶3</p>' +
                                '</li>' +
                                '<li>' +
                                    '<p>4◀</p>' +
                                '</li>' +
                            '</ul>' +
                        '</li>' +
                        '<li>' +
                            '<p>5</p>' +
                        '</li>' +
                    '</ul>',
            },
        ]
        this.indentTests = [
            {
                name: "Click INDENT: li -> indented li",
                content: '<ul><li><p>dom</p></li><li><p>t◆o edit</p></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnIndent, ['mousedown', 'click']);
                },
                test: '<ul><li><p>dom</p></li><li class="o_indent"><ul><li><p>t◆o edit</p></li></ul></li></ul>',
            },
        ];
        this.outdentTests = [
            {
                name: "Click OUTDENT: indented li -> li",
                content: '<ul><li><p>dom</p></li><li><ul><li><p>t◆o edit</p></li></ul></li></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<ul><li><p>dom</p></li><li><p>t◆o edit</p></li></ul>',
            },
            {
                name: "Click OUTDENT: indented li -> li (2)",
                content: '<ul><li><p>dom</p></li><ul><li><p>t◆o edit</p></li></ul></ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<ul><li><p>dom</p></li><li><p>t◆o edit</p></li></ul>',
            },
            {
                name: "Click OUTDENT on LI in OL in OL",
                content: '<p>x</p>' +
                    '<ol>' +
                    '<li><p>aaa</p></li>' +
                    '<li><ol>' +
                    '<li><p>bbb</p></li>' +
                    '<li><p>c◆cc</p></li>' +
                    '<li><p>ddd</p></li>' +
                    '</ol></li>' +
                    '<li><p>eee</p></li>' +
                    '</ol>' +
                    '<p>y</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<p>x</p>' +
                        '<ol>' +
                        '<li><p>aaa</p></li>' +
                        '<li class="o_indent"><ol>' +
                        '<li><p>bbb</p></li>' +
                        '</ol></li>' +
                        '<li><p>c◆cc</p></li>' +
                        '<li class="o_indent"><ol>' +
                        '<li><p>ddd</p></li>' +
                        '</ol></li>' +
                        '<li><p>eee</p></li>' +
                        '</ol>' +
                        '<p>y</p>',
            },
            {
                name: "Click OUTDENT on LI in OL in OL (2)",
                content: '<p>x</p>' +
                    '<ol>' +
                    '<li><p>aaa</p></li>' +
                    '<ol>' +
                    '<li><p>bbb</p></li>' +
                    '<li><p>c◆cc</p></li>' +
                    '<li><p>ddd</p></li>' +
                    '</ol>' +
                    '<li><p>eee</p></li>' +
                    '</ol>' +
                    '<p>y</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<p>x</p>' +
                        '<ol>' +
                        '<li><p>aaa</p></li>' +
                        '<li class="o_indent">' +
                        '<ol>' +
                        '<li><p>bbb</p></li>' +
                        '</ol></li>' +
                        '<li><p>c◆cc</p></li>' +
                        '<li class="o_indent">' +
                        '<ol>' +
                        '<li><p>ddd</p></li>' +
                        '</ol></li>' +
                        '<li><p>eee</p></li>' +
                        '</ol>' +
                        '<p>y</p>',
            },
            {
                name: "Click OUTDENT on LI in OL",
                content:
                    '<ol>' +
                    '<li><p>aaa</p></li>' +
                    '<li><p>b◆bb</p></li>' +
                    '<li><p>ccc</p></li>' +
                    '</ol>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<ol>' +
                        '<li><p>aaab◆bb</p></li>' +
                        '<li><p>ccc</p></li>' +
                        '</ol>',
            },
            {
                name: "Click OUTDENT on P with indent in a LI (must outdent the p)",
                content:
                    '<ul>' +
                    '<li>' +
                    '<ul>' +
                    '<li>' +
                    '<p style="margin-left: 1.5em;">d◆om</p>' +
                    '</li>' +
                    '</ul>' +
                    '</li>' +
                    '</ul>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<ul>' +
                        '<li class="o_indent">' +
                        '<ul>' +
                        '<li>' +
                        '<p>d◆om</p>' +
                        '</li>' +
                        '</ul>' +
                        '</li>' +
                        '</ul>',
            },
        ];
        this.toolbarTests = this.ulTests
            .concat(this.olTests)
            .concat(this.checklistTests)
            .concat(this.conversionTests)
            .concat(this.indentTests)
            .concat(this.outdentTests);
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];

        var listGroup = wysiwyg.querySelector('we3-group[data-plugin="List"]');
        this.btnUl = listGroup.querySelector('we3-button[name="list-ul"]');
        this.btnOl = listGroup.querySelector('we3-button[name="list-ol"]');
        this.btnChecklist = listGroup.querySelector('[name="list-checklist"]');

        var indentGroup = wysiwyg.querySelector('we3-group[data-plugin="Indent"]');
        this.btnIndent = indentGroup.querySelector('we3-button[name="indent-in"]');
        this.btnOutdent = indentGroup.querySelector('we3-button[name="indent-out"]');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarList', TestToolbarList);

})();
