(function () {
'use strict';

var TestToolbarWand = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestToolbar', 'Text'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀
    
        this.toolbarTests = [{
                name: "Click H1: p -> h1",
                content: '<p>dom not to edit</p><p>d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><h1>▶dom to edit◀</h1>',
            },
            {
                name: "Click CODE: h1 -> pre",
                content: '<p>dom not to edit</p><h1>d◆om to edit</h1>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-pre"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><pre>▶dom to edit◀</pre>',
            },
            {
                name: "Click NORMAL: pre -> p",
                content: '<p>dom not to edit</p><pre>d◆om to edit</pre>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-p"]'), ['mousedown', 'click']);
                },
                test: '<p>dom not to edit</p><p>▶dom to edit◀</p>',
            },
            {
                name: "Click H1 in empty p: empty p -> empty h1",
                content: '<p><br>◆</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<h1>▶<br/>◀</h1>',
            },
            {
                name: "Click H1 in selection containing multiple blocks (1)",
                content: '<p>d▶om</p><h1>to</h1><h6>edi◀t</h6>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<h1>▶dom</h1><h1>to</h1><h1>edit◀</h1>',
            },
            {
                name: "Click H1 in selection containing multiple blocks (2)",
                content: '<div><p>d▶om</p><h1>to</h1><h6>edi◀t</h6></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<div><h1>▶dom</h1><h1>to</h1><h1>edit◀</h1></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks (3)",
                content: '<div><p>nope</p><div><p>d▶om</p><h1>to</h1><h6>ed</h6></div><p>i◀t</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<div><p>nope</p><div><h1>▶dom</h1><h1>to</h1><h1>ed</h1></div><h1>it◀</h1></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with unbreakable (1)",
                content: '<p>d▶om</p><h1>to</h1><div class="unbreakable"><h6>edi◀t</h6></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<h1>▶dom</h1><h1>to◀</h1><div class="unbreakable"><h6>edit</h6></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with unbreakable (2)",
                content: '<div><p>nope</p><div><p>d▶om</p><h1>to</h1><div class="unbreakable"><h6>ed</h6></div></div><p>i◀t</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<div><p>nope</p><div><h1>▶dom</h1><h1>to</h1><div class="unbreakable"><h1>ed</h1></div></div><h1>it◀</h1></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with not editable (1)",
                content: '<p>d▶om</p><h1>to</h1><div class="noteditable"><h6>edi◀t</h6></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<h1>▶dom</h1><h1>to◀</h1><div class="noteditable"><h6>edit</h6></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with not editable (2)",
                content: '<div><p>nope</p><div><p>d▶om</p><h1>to</h1><div class="noteditable"><h6>ed</h6></div></div><p>i◀t</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<div><p>nope</p><div><h1>▶dom</h1><h1>to</h1><div class="noteditable"><h6>ed</h6></div></div><h1>it◀</h1></div>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with not editable (3)",
                content: '<p>d▶om</p><h1>to</h1><h6 class="noteditable">edi◀t</h6>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<h1>▶dom</h1><h1>to◀</h1><h6 class="noteditable">edit</h6>',
            },
            {
                name: "Click H1 in selection containing multiple blocks with not editable (4)",
                content: '<div><p>nope</p><div><p>d▶om</p><h1>to</h1><h6 class="noteditable">ed</h6></div><p>i◀t</p></div>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.styleToggler, ['mousedown', 'click']);
                    await self.dependencies.Test.triggerNativeEvents(self.styleDropdown.querySelector('we3-button[name="formatBlock-h1"]'), ['mousedown', 'click']);
                },
                test: '<div><p>nope</p><div><h1>▶dom</h1><h1>to</h1><h6 class="noteditable">ed</h6></div><h1>it◀</h1></div>',
            },
        ];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        this.styleDropdown = wysiwyg.querySelector('we3-dropdown[name="Style"]');
        this.styleToggler = this.styleDropdown.querySelector('we3-toggler');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarWand', TestToolbarWand);

})();
