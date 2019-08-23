(function () {
'use strict';

var TestToolbarIndent = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'TestToolbar', 'Indent'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Test', 'TestToolbar'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.indentTests = [
            {
                name: "Click INDENT: p -> indented p",
                content: '<p>d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnIndent, ['mousedown', 'click']);
                },
                test: '<p style="margin-left:1.5em">d◆om to edit</p>',
            },
            {
                name: "Click INDENT: p -> indented p (with selection)",
                content: '<p>aaa</p><p>▶bbb</p><p>ccc</p><p>ddd◀</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnIndent, ['mousedown', 'click']);
                },
                test: '<p>aaa</p><p style="margin-left:1.5em">▶bbb</p><p style="margin-left:1.5em">ccc</p><p style="margin-left:1.5em">ddd◀</p>',
            },
        ];
        this.outdentTests = [
            {
                name: "Click OUTDENT: indented p -> p",
                content: '<p style="margin-left: 1.5em;">d◆om to edit</p>',
                do: async function () {
                    await self.dependencies.Test.triggerNativeEvents(self.btnOutdent, ['mousedown', 'click']);
                },
                test: '<p>d◆om to edit</p>',
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
        this.toolbarTests = this.indentTests
            .concat(this.outdentTests);
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        var indentGroup = wysiwyg.querySelector('we3-group[data-plugin="Indent"]');
        this.btnIndent = indentGroup.querySelector('we3-button[name="indent-in"]');
        this.btnOutdent = indentGroup.querySelector('we3-button[name="indent-out"]');
        return this.dependencies.TestToolbar.test(assert, this.toolbarTests);
    }
};

we3.addPlugin('TestToolbarIndent', TestToolbarIndent);

})();
