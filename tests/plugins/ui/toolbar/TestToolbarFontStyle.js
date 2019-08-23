(function () {
'use strict';

var TestToolbarFontStyle = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestToolbar', 'FontStyle'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.boldTests = [{
                name: "Click BOLD: normal -> bold",
                content: '<p>dom not to edit</p><p>d▶om t◀o edit</p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d<b>▶om t◀</b>o edit</p>',
            },
            {
                name: "Click BOLD then 'a': normal -> bold (empty p)",
                content: '<p><br>◆</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    return self.dependencies.TestToolbar.keydown('a');
                },
                test: '<p><b>a◆</b></p>',
            },
            {
                name: "Click BOLD: normal -> bold (across paragraphs)",
                content: '<p>d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>d▶<b>om to edit</b></p><p><b>dom t◀</b>o edit</p>',
            },
            {
                name: "Click BOLD then 'a': normal -> bold (no selection)",
                content: '<p>dom not to edit</p><p>dom ◆to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    return self.dependencies.TestToolbar.keydown('a');
                },
                test: '<p>dom not to edit</p><p>dom <b>a◆</b>to edit</p>',
            },
            {
                name: "Click BOLD: bold -> normal",
                content: '<p>dom not to edit</p><p><b>▶dom to edit◀</b></p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>▶dom to edit◀</p>',
            },
            {
                name: "Click BOLD: bold -> normal (partial selection)",
                content: '<p>dom not to edit</p><p><b>dom ▶to◀ edit</b></p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>dom </b>▶to◀<b> edit</b></p>',
            },
            {
                name: "Click BOLD: bold -> normal (no selection) -> 'a'",
                content: '<p>dom not to edit</p><p><b>dom ◆to edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    return self.dependencies.TestToolbar.keydown('a');
                },
                test: '<p>dom not to edit</p><p><b>dom </b>a◆<b>to edit</b></p>',
            },
            {
                name: "Click BOLD: bold + normal -> bold",
                content: '<p><b>d▶om </b>to e◀dit</p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p><b>d▶om to e◀</b>dit</p>',
            },
            {
                name: "Click BOLD: normal -> bold (with fontawesome)",
                content: '<p>a▶aa<span class="fa fa-heart"></span>bb◀b</p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>a▶<b>aa<span class="fa fa-heart"></span>bb◀</b>b</p>',
            },
            {
                name: "Click BOLD: bold -> normal (with fontawesome)",
                content: '<p><b>a▶aa<span class="fa fa-heart"></span>bb◀b</b></p>',
                do: async function () {
                    return self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p><b>a▶</b>aa<span class="fa fa-heart"></span>bb◀<b>b</b></p>',
            },
        ];
        this.italicTests = [
            {
                name: "Click ITALIC: bold -> bold + italic",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnItalic, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d<i>▶om t◀</i>o edit</b></p>',
            },
            {
                name: "Click ITALIC: bold & normal -> italic & bold + italic (across paragraphs)",
                content: '<p>d▶om <b>to</b> edit</p><p><b>dom t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnItalic, ['mousedown', 'click']);
                },
                test: '<p>d▶<i>om </i><b><i>to</i></b><i> edit</i></p><p><b><i>dom t◀</i>o edit</b></p>',
            },
        ];
        this.strikethroughTests = [
            {
                name: "Click strikethrough: bold -> bold + strikethrough",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnStrikethrough, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d<s>▶om t◀</s>o edit</b></p>',
            },
            {
                name: "Click strikethrough: bold & normal -> strikethrough & bold + strikethrough (across paragraphs)",
                content: '<p>d▶om <b>to</b> edit</p><p><b>dom t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnStrikethrough, ['mousedown', 'click']);
                },
                test: '<p>d<s>▶om <b>to</b> edit</s></p><p><b><s>dom t◀</s>o edit</b></p>',
            },
        ];
        this.subscriptTests = [
            {
                name: "Click subscript: bold -> bold + subscript",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnSubscript, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d<sub>▶om t◀</sub>o edit</b></p>',
            },
            {
                name: "Click subscript: bold & normal -> subscript & bold + subscript (across paragraphs)",
                content: '<p>d▶om <b>to</b> edit</p><p><b>dom t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnSubscript, ['mousedown', 'click']);
                },
                test: '<p>d<sub>▶om <b>to</b> edit</sub></p><p><b><sub>dom t◀</sub>o edit</b></p>',
            },
        ];
        this.superscriptTests = [
            {
                name: "Click superscript: bold -> bold + superscript",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnSuperscript, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d<sup>▶om t◀</sup>o edit</b></p>',
            },
            {
                name: "Click superscript: bold & normal -> superscript & bold + superscript (across paragraphs)",
                content: '<p>d▶om <b>to</b> edit</p><p><b>dom t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnSuperscript, ['mousedown', 'click']);
                },
                test: '<p>d<sup>▶om <b>to</b> edit</sup></p><p><b><sup>dom t◀</sup>o edit</b></p>',
            },
        ];
        this.underlineTests = [
            {
                name: "Click UNDERLINE: bold -> bold + underlined",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUnderline, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d<u>▶om t◀</u>o edit</b></p>',
            },
            {
                name: "Click UNDERLINE: bold & normal -> underlined & bold + underlined (across paragraphs)",
                content: '<p>d▶om<b>to</b> edit</p><p><b>dom t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnUnderline, ['mousedown', 'click']);
                },
                test: '<p>d▶<u>om</u><b><u>to</u></b><u> edit</u></p><p><b><u>dom t◀</u>o edit</b></p>',
            },
        ];
    
        this.removeFontStyleTests = [
            {
                name: "Click REMOVE FONT STYLE: bold -> normal",
                content: '<p>dom not to edit</p><p><b>d▶om t◀o edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnRemoveStyles, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><b>d</b>▶om t◀<b>o edit</b></p>',
            },
            {
                name: "Click REMOVE FONT STYLE: bold, italic, underlined & normal -> normal (across paragraphs)",
                content: '<p>d▶om <b>t<i>o</i></b> e<u>dit</u></p><p><b><u>dom◀</u> to edit</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnRemoveStyles, ['mousedown', 'click']);
                },
                test: '<p>d▶om to edit</p><p>dom◀<b> to edit</b></p>',
            },
            {
                name: "Click REMOVE FONT STYLE: complex -> normal",
                content: '<p>a▶aa<font style="background-color: rgb(255, 255, 0);">bbb</font></p><p><font style="color: rgb(255, 0, 0);">c◀cc</font></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnRemoveStyles, ['mousedown', 'click']);
                },
                test: '<p>a▶aabbb</p><p>c◀<font style="color:rgb(255, 0, 0)">cc</font></p>',
            },
            {
                name: "Click REMOVE FONT STYLE: complex -> normal (with icon)",
                content: '<p>▶a<b>a</b>a<span class="bg-alpha text-alpha fa fa-heart" style="font-size: 10px;"></span>b<b><i>b◀</i>b</b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnRemoveStyles, ['mousedown', 'click']);
                },
                test: '<p>▶aaa<span class="bg-alpha fa fa-heart text-alpha"></span>bb◀<b>b</b></p>', // todo: check if must remove bg-alpha text-alpha
            },
        ];
        this.complexFontStyleTests = [
            {
                name: "COMPLEX Click BOLD: italic -> italic bold (partial selection)",
                content: '<p>dom not to edit</p><p><i>d▶om t◀o edit</i></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p><i>d</i><b><i>▶om t◀</i></b><i>o edit</i></p>',
            },
            {
                name: "COMPLEX Click BOLD then 'a': italic bold -> italic (across paragraphs)",
                content: '<p><b><i>d▶om to edit</i></b></p><p><i><b>dom t◀o edit</b></i></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    await self.dependencies.TestToolbar.keydown('a', {
                        firstDeselect: true,
                    });
                },
                test: '<p><b><i>d</i></b><i>om to edit</i></p><p><i>dom ta◆</i><b><i>o edit</i></b></p>',
            },
            {
                name: "COMPLEX Click BOLD then 'a': bold italic -> italic (no selection)",
                content: '<p><b><i>dom ◆to edit</i></b></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    await self.dependencies.TestToolbar.keydown('a', {
                        firstDeselect: true,
                    });
                },
                test: '<p><b><i>dom </i></b><i>a◆</i><b><i>to edit</i></b></p>',
            },
            {
                name: "COMPLEX Click BOLD then 'a': underlined italic -> underlined italic bold (across paragraphs)",
                content: '<p><u><i>d▶om to edit</i></u></p><p><i><u>dom t◀o edit</u></i></p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    await self.dependencies.TestToolbar.keydown('a', {
                        firstDeselect: true,
                    });
                },
                test: '<p><i><u>d</u></i><b><i><u>om to edit</u></i></b></p><p><b><i><u>dom ta◆</u></i></b><i><u>o edit</u></i></p>',
            },
            {
                name: "COMPLEX Click BOLD then 'a': underlined italic -> underlined italic bold (no selection)",
                content: '<p><u><i>d◆om to edit</i></u></p>',
                                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
                    await self.dependencies.TestToolbar.keydown('a', {
                        firstDeselect: true,
                    });
                },
                test: '<p><i><u>d</u></i><b><i><u>a◆</u></i></b><i><u>om to edit</u></i></p>',
            },
        ];

        this.toolbarTests = this.boldTests
            .concat(this.italicTests)
            .concat(this.underlineTests)
            /* .concat(this.strikethroughTests)
            .concat(this.superscriptTests)
            .concat(this.subscriptTests) */
            .concat(this.removeFontStyleTests)
            .concat(this.complexFontStyleTests);
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        var fontStyleGroup = wysiwyg.querySelector('we3-group[data-plugin="FontStyle"]');
        this.btnBold = fontStyleGroup.querySelector('we3-button[name="formatText-b"]');
        this.btnItalic = fontStyleGroup.querySelector('we3-button[name="formatText-i"]');
        this.btnUnderline = fontStyleGroup.querySelector('[name="formatText-u"]');
        this.btnStrikethrough = fontStyleGroup.querySelector('[name="formatText-s]');
        this.btnSuperscript = fontStyleGroup.querySelector('[name="formatText-sup"]');
        this.btnSubscript = fontStyleGroup.querySelector('[name="formatText-sub"]');
        this.btnRemoveStyles = fontStyleGroup.querySelector('[name="formatText-remove');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarFontStyle', TestToolbarFontStyle);

})();
