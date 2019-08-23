(function () {
'use strict';

var TestToolbarParagraph = class extends we3.AbstractPlugin {
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

        this.leftTests = [
            {
                name: "Click ALIGN LEFT: p -> p align left (does nothing)",
                content: '<p>dom not to edit</p><p>d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnLeft, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>d◆om to edit</p>',
            },
            {
                name: "Click ALIGN LEFT: p (parent align right) -> p align left",
                content: '<div style="text-align: right;"><p>dom not to edit</p><p>d▶om t◀o edit</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnLeft, ['mousedown', 'click']);
                },
                test: '<div style="text-align:right"><p>dom not to edit</p><p style="text-align:left">d▶om t◀o edit</p></div>',
            },
            {
                name: "Click ALIGN LEFT: p (parent align left) -> p align left (does nothing)",
                content: '<div style="text-align: left;"><p>dom not to edit</p><p>d▶om t◀o edit</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnLeft, ['mousedown', 'click']);
                },
                test: '<div style="text-align:left"><p>dom not to edit</p><p>d▶om t◀o edit</p></div>',
            },
        ];
        this.centerTests = [
            {
                name: "Click ALIGN CENTER: p -> p align center",
                content: '<p>dom not to edit</p><p>d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnCenter, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:center">d◆om to edit</p>',
            },
            {
                name: "Click ALIGN CENTER: p align left & default -> p align center (across paragraphs)",
                content: '<p>dom not to edit</p><p style="text-align: left;">d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnCenter, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:center">d▶om to edit</p><p style="text-align:center">dom t◀o edit</p>',
            },
        ];
        this.rightTests = [
            {
                name: "Click ALIGN RIGHT: p align center -> p align right",
                content: '<p>dom not to edit</p><p style="text-align: center;">d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnRight, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:right">d◆om to edit</p>',
            },
            {
                name: "Click ALIGN RIGHT: p align center & default -> p align right (across paragraphs)",
                content: '<p>dom not to edit</p><p style="text-align: center;">d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnRight, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:right">d▶om to edit</p><p style="text-align:right">dom t◀o edit</p>',
            },
            {
                name: "Click ALIGN RIGHT: p align justify & default -> p align right (across paragraphs)",
                content: '<p>dom not to edit</p><p style="text-align: justify;">d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnRight, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:right">d▶om to edit</p><p style="text-align:right">dom t◀o edit</p>',
            },
        ];
        this.justifyTests = [
            {
                name: "Click ALIGN JUSTIFY: p align right -> p align justify",
                content: '<p>dom not to edit</p><p style="text-align: right;">d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnJustify, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:justify">d◆om to edit</p>',
            },
            {
                name: "Click ALIGN JUSTIFY: p align right & default -> p align justify (across paragraphs)",
                content: '<p>dom not to edit</p><p style="text-align: right;">d▶om to edit</p><p>dom t◀o edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.paraToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.btnJustify, ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p style="text-align:justify">d▶om to edit</p><p style="text-align:justify">dom t◀o edit</p>',
            },
        ];
        
        this.toolbarTests = this.leftTests
            .concat(this.centerTests)
            .concat(this.rightTests)
            .concat(this.justifyTests);
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        var paraGroup = wysiwyg.querySelector('we3-group[data-plugin="Paragraph"] we3-group');
        this.paraToggler = wysiwyg.querySelector('we3-dropdown[name="Paragraph"]');
        this.btnLeft = paraGroup.querySelector('we3-button[name="align-left"]');
        this.btnCenter = paraGroup.querySelector('we3-button[name="align-center"]');
        this.btnRight = paraGroup.querySelector('we3-button[name="align-right"]');
        this.btnJustify = paraGroup.querySelector('we3-button[name="align-justify"]');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarParagraph', TestToolbarParagraph);

})();
