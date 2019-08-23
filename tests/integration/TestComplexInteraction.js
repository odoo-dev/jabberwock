(function () {
'use strict';

/**
 * This tests complex interactions between various plugins of the default configuration.
 * Disable if you do not use all plugins of the default configuration.
 */

var TestComplexInteraction = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test'];
    }
    constructor () {
        super(...arguments);
        var self = this;
        this.dependencies = ['Range', 'Test'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.tests = [
            // {
            //     name: "Bold -> Unbold -> Deselect -> Convert list type (depends on: FontStyle, List)",
            //     content: "<ul><li><p>a▶b◀c</p></li></ul>",
            //     do: async function () {
            //         await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
            //         await self.dependencies.Test.triggerNativeEvents(self.btnBold, ['mousedown', 'click']);
            //         self._collapseRange(false);
            //         await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
            //     },
            //     test: "<ol><li><p>ab◆c</p></li></ol>",
            // },
            // {
            //     name: "(<=>) Convert list type after virtual",
            //     content: "<ul><li><p>ab\uFEFF◆c</p></li></ul>",
            //     do: async function () {
            //         await self.dependencies.Test.triggerNativeEvents(self.btnOl, ['mousedown', 'click']);
            //     },
            //     test: "<ol><li><p>ab◆c</p></li></ol>",
            // },
            {
                name: "In p: ENTER -> BACKSPACE -> Select across merge -> ENTER",
                content: "<p>ab◆cd</p>",
                do: async function () {
                    await self.dependencies.Test.keydown(self.editable, { keyCode: 13 }); // ENTER
                    await self.dependencies.Test.keydown(self.editable, { keyCode: 8 }); // BACKSPACE
                    var currentRange = self.dependencies.Range.getRange();
                    var root = currentRange.scArch.ancestor('isRoot');
                    var p = root.descendents(node => node.nodeName === 'p')[0];
                    var textStart = p.firstChild();
                    var textEnd = p.lastChild();
                    await self.dependencies.Range.setRange({
                        scID: textStart.id,
                        so: 1,
                        ecID: textEnd.id,
                        eo: textEnd.length() - 1,
                    });
                    await self.dependencies.Test.keydown(self.editable, { keyCode: 13 }); // ENTER
                },
                test: "<p>a</p><p>◆d</p>",
            },
            {
                name: "(<=>) In p: ENTER on selection across virtual",
                content: "<p>a▶b\uFEFFc◀d</p>",
                do: async function () {
                    await self.dependencies.Test.keydown(self.editable, { keyCode: 13 }); // ENTER
                },
                test: "<p>a</p><p>◆d</p>",
            },
        ];
    }
    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }
    test (assert) {
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];

        var fontStyleGroup = wysiwyg.querySelector('we3-group[data-plugin="FontStyle"]');
        this.btnBold = fontStyleGroup.querySelector('we3-button[name="formatText-b"]');

        var listGroup = wysiwyg.querySelector('we3-group[data-plugin="List"]');
        this.btnOl = listGroup.querySelector('we3-button[name="list-ol"]');

        return this.dependencies.Test.execTests(assert, this.tests);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Set a new range by collapsing the current one.
     *
     * @param {boolean} onStart true to collapse on the start point
     */
    _collapseRange (onStart) {
        var currentRange = this.dependencies.Range.getRange();
        var collapsedRange = currentRange.collapse(onStart);
        this.dependencies.Range.setRange(collapsedRange);
    }
};

we3.addPlugin('TestComplexInteraction', TestComplexInteraction);

})();
