(function () {
'use strict';

var TestPopover = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'Popover'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test', 'Popover'];

        this.tests = [
        // image popover
        // config: 'Image.getArchNode': plugins
        {
            name: 'Click on image shoud select image and display the image popover',
            content: '<p>◆aaa <img src="/web_editor/static/src/img/transparent.png"/> bbb</p>',
            click: 'we3-editable img',
            test: '<p>aaa ▶<img src="/web_editor/static/src/img/transparent.png"/>◀ bbb</p>',
            activePopovers: ['Image'],
        },

        // document popover
        // 'Document.getArchNode': plugins
        {
            name: 'Click on document shoud select document display the document popover',
            content: '<p>◆aaa <a title="image" href="/web_editor/static/src/img/transparent.png" target="_BLANK" class="we3-document"><img src="/web_editor/static/lib/we3/src/img/mimetypes/image.svg" class="we3-document-image"/></a> bbb</p>',
            click: 'we3-editable img',
            test: '<p>aaa ▶<a title="image" href="/web_editor/static/src/img/transparent.png" target="_BLANK" class="we3-document"><img src="/web_editor/static/lib/we3/src/img/mimetypes/image.svg" class="we3-document-image"/></a>◀ bbb</p>',
            activePopovers: ['Document'],
        },

        // Pictogram popover
        // 'Pictogram.getArchNode':  plugins
        {
            name: 'Click on pictogram shoud select pictogram display the pictogram popover',
            content: '<p>◆aaa <span class="fa fa-star"></span> bbb</p>',
            click: 'we3-editable .fa',
            test: '<p>aaa ▶<span class="fa fa-star"></span>◀ bbb</p>',
            activePopovers: ['Pictogram'],
        },

        // Video popover
        // 'Video.getArchNode': plugins
        {
            name: 'Click on video shoud display the video popover',
            content: '<p>◆aaa </p><div class="media_iframe_video"><iframe src="about:blank"/></div><p> bbb</p>',
            click: 'we3-editable iframe',
            test: '<p>aaa</p>▶<div class="media_iframe_video"><iframe src="about:blank"/></div>◀<p>bbb</p>',
            activePopovers: ['Video'],
        },

        // Text popover
        // 'Text.get': plugins for air mode
        {
            name: 'Click on video shoud display the text popover (need "Text.get" popover for air mode)',
            content: '<p>Bonjour,<br/><i>comment va-</i><b><i>tu</i></b><i> ?</i></p>',
            click: 'we3-editable i',
            test: '<p>Bonjour,<br/><i>◆comment va-</i><b><i>tu</i></b><i> ?</i></p>',
            activePopovers: this.options.popover['Text.get'] ? ['Text'] : [],
        },

        // Link popover
        // 'Link.get': plugins
        {
            name: 'Click on link shoud display the link popover and the text popover (for air mode)',
            content: '<p>◆aaa <a href="https://www.odoo.com">Odoo</a> bbb</p>',
            click: 'we3-editable a',
            test: '<p>aaa <a href="https://www.odoo.com">◆Odoo</a> bbb</p>',
            activePopovers: this.options.popover['Text.get'] ? ['Link', 'Text'] : ['Link'],
        },

        // Table popover + Text popover
        // 'Table.get': plugins
        // 'Text.get': plugins for air mode
        {
            name: 'Click on link in table cell shoud display the cell popover and the link popover',
            content: '<table><tbody><tr><td>wrong TD</td></tr><tr><td>free text in table <a href="https://www.odoo.com">◆Odoo</a></td></tr></tbody></table>',
            click: 'we3-editable a',
            test: '<table><tbody><tr><td>wrong TD</td></tr><tr><td>free text in table <a href="https://www.odoo.com">◆Odoo</a></td></tr></tbody></table>',
            activePopovers: this.options.popover['Text.get'] ? ['Table', 'Link', 'Text'] : ['Table', 'Link'],
        },];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    async test (assert) {
        this.tests.forEach((test) => test.do = test.do || this._functionDo.bind(this, assert, test));
        return this.dependencies.Test.execTests(assert, this.tests);
    }

    async _functionDo (assert, test) {
        var target = this.editor.querySelector(test.click);
        await this.dependencies.Test.click(target);
        var activePopovers = [];
        this.editor.querySelectorAll('we3-popover').forEach(function (popover) {
            if (popover.style.display !== '') {
                activePopovers.push(popover.getAttribute('name'));
            }
        });
        var popoverNames = test.activePopovers.slice();
        test.activePopovers.sort();
        activePopovers.sort();
        assert.strictEqual(activePopovers.join(','), test.activePopovers.join(','), test.name + ' (popovers)');
    }
};

we3.addPlugin('TestPopover', TestPopover);

})();
