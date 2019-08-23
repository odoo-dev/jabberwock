(function () {
'use strict';

var TestToolbarColor = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestToolbar', 'Paragraph'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.foreColorTests = [
            {
                name: "Click THEME COLORS - ALPHA: default -> alpha theme color",
                content: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-alpha"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font class="text-alpha">▶om t◀</font>o edit</p>',
            },
            {
                name: "Click THEME COLORS - BLACK 25: alpha theme color & default -> black 25",
                content: '<p>dom not to edit</p><p>d▶o<font class="text-alpha">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-black-25"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font class="text-black-25">▶om t◀</font><font class="text-alpha">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: black 25 & default -> blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font class="text-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="color:#0000FF">▶om t◀</font><font class="text-black-25">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: bg-black-25 & default -> bg-black-25 & text blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font class="bg-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="color:#0000FF">▶o</font><font class="bg-black-25" style="color:#0000FF">m t◀</font><font class="bg-black-25">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: bg blue #0000FF & default -> bg blue #0000FF & text blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font style="background-color:#0000FF">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="color:#0000FF">▶o</font><font style="background-color:#0000FF; color:#0000FF">m t◀</font><font style="background-color:#0000FF">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: text blue #0000FF & default -> text blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font style="color:#0000FF">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="color:#0000FF">▶om t◀o </font>edit</p>',
            },
            {
                name: "Click RESET TO DEFAULT: black 25 & default -> default",
                content: '<p>dom not to edit</p><p>d▶o<font class="text-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-reset"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om t◀<font class="text-black-25">o </font>edit</p>',
            },
            {
                name: "Apply a color on a fontawesome",
                content: '<p>dom <i class="fa fa-glass">◆</i>not to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom <font style="color:#0000FF">▶<i class="fa fa-glass"></i>◀</font>not to edit</p>',
            },
            {
                name: "Apply a color on a font with text",
                content: '<p>d▶om <i class="fa fa-glass"></i>not to◀ edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>d<font style="color:#0000FF">▶om <i class="fa fa-glass"></i>not to◀</font> edit</p>',
            },
            {
                name: "Apply color, then 'a' (no selection)",
                content: '<p>d◆om not to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                    await self.dependencies.TestToolbar.keydown('a', {
                        firstDeselect: true,
                    });
                },
                test: '<p>d<font style="color:#0000FF">a◆</font>om not to edit</p>',
            },
            /* {
                name: "Apply color on two ranges with the same color",
                content: '<p>d▶o<br><span class="toto">       </span>m no◀t to edit</p>',
                do: async function ($editable) {
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);

                    var range = self.dependencies.Test.select('p:contents()[5]->3', 'p:contents()[5]->6');
                    Wysiwyg.setRange(range);
                    var target = range.sc.tagName ? range.sc : range.sc.parentNode;
                    await testUtils.dom.triggerNativeEvents(target, ['mousedown', 'mouseup']);

                    await self.dependencies.Test.triggerNativeEvents(self.foreColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.foreColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>d<font style="color: rgb(0, 0, 255);">o</font><br><span class="toto">       </span><font style="color: rgb(0, 0, 255);">m no</font>t t<font style=\"color: rgb(0, 0, 255);\">▶o e◀</font>dit</p>',
            }, */
        ];
        this.bgColorTests = [
            {
                name: "Click THEME COLORS - ALPHA: default -> alpha theme color",
                content: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-alpha"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font class="bg-alpha">▶om t◀</font>o edit</p>',
            },
            {
                name: "Click THEME COLORS - BLACK 25: alpha theme color & default -> black 25",
                content: '<p>dom not to edit</p><p>d▶o<font class="bg-alpha">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-black-25"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font class="bg-black-25">▶om t◀</font><font class="bg-alpha">o </font>edit</p>',
            },
            {
                name: "Click THEME COLORS - BLACK 25: alpha theme color -> black 25 (partial selection)",
                content: '<p><font class="bg-alpha">d▶om t◀o edit</font></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-black-25"]'), ['mousedown', 'click']);
                },
                test: '<p><font class="bg-alpha">d</font><font class="bg-black-25">▶om t◀</font><font class="bg-alpha">o edit</font></p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: black 25 & default -> blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font class="bg-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="background-color:#0000FF">▶om t◀</font><font class="bg-black-25">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: text-black-25 & default -> text-black-25 & bg blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font class="text-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="background-color:#0000FF">▶o</font><font class="text-black-25" style="background-color:#0000FF">m t◀</font><font class="text-black-25">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLUE #0000FF: text blue #0000FF & default -> text blue #0000FF & bg blue #0000FF",
                content: '<p>dom not to edit</p><p>d▶o<font style="color:#0000FF">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-#0000FF"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<font style="background-color:#0000FF">▶o</font><font style="color:#0000FF; background-color:#0000FF">m t◀</font><font style="color:#0000FF">o </font>edit</p>',
            },
            {
                name: "Click COMMON COLORS - BLACK #FFFFFF: bg multiple -> bg black #FFFFFF",
                content: '<p>one<font style="background-color:#FFFF00">▶two</font><font class="bg-alpha">three◀</font>four</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-#FFFFFF"]'), ['mousedown', 'click']);
                },
                test: '<p>one<font style="background-color:#FFFFFF">▶twothree◀</font>four</p>',
            },
            {
                name: "Click RESET TO DEFAULT: black 25 & default -> default",
                content: '<p>dom not to edit</p><p>d▶o<font class="bg-black-25">m t◀o </font>edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.bgColorDropdown.querySelector('we3-button[name="color-reset"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d▶om t◀<font class="bg-black-25">o </font>edit</p>',
            },
    ];

        this.toolbarTests = this.foreColorTests
            .concat(this.bgColorTests);
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        this.foreColorDropdown = wysiwyg.querySelector('we3-dropdown[name="Color"]');
        this.foreColorToggler = this.foreColorDropdown.querySelector('we3-toggler');
        this.bgColorDropdown = wysiwyg.querySelector('we3-dropdown[name="Background color"]');
        this.bgColorToggler = this.bgColorDropdown.querySelector('we3-toggler');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarColor', TestToolbarColor);

})();
