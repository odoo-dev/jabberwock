(function () {
'use strict';

var TestToolbar = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test', 'Toolbar'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Range', 'Test', 'Toolbar'];
    }

    /**
     * Perform a series of tests (`toolbarTests`) for using keyboard inputs.
     *
     * @see wysiwyg_keyboard_tests.js
     * @see wysiwyg_tests.js
     *
     * @param {object} assert
     * @param {object[]} toolbarTests
     * @param {string} toolbarTests.name
     * @param {string} toolbarTests.content
     * @param {object[]} toolbarTests.steps
     * @param {string} toolbarTests.steps.start
     * @param {string} [toolbarTests.steps.end] default: steps.start
     * @param {string} toolbarTests.steps.key
     * @param {object} toolbarTests.test
     */
    test (assert, toolbarTests) {
        return this.dependencies.Test.execTests(assert, toolbarTests);
    }
    /**
     * Trigger a keydown event.
     *
     * @param {String or Number} key (name or code)
     * @param {Object} [options]
     * @param {Boolean} [options.firstDeselect] (default: false) true to deselect before pressing
     */
    keydown (key, options) {
        var range = this.dependencies.Range.getRange();
        if (!range) {
            console.error("Editor has no range");
            return;
        }
        if (options && options.firstDeselect) {
            range = range.collapse(false); // collapse on end point
            this.dependencies.Range.setRange(range);
        }
        var target = range.ec.tagName ? range.ec : range.ec.parentNode;
        var keydown = typeof key === 'string' ? {key: key} : {keyCode: key};
        return this.dependencies.Test.keydown(target, keydown);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _querySelectorAllWithEq (selector, document) {
        var remainingSelector = selector;
        var baseElement = document;
        var firstEqIndex = remainingSelector.indexOf(':eq(');

        while (firstEqIndex !== -1) {
            var leftSelector = remainingSelector.substring(0, firstEqIndex);
            var rightBracketIndex = remainingSelector.indexOf(')', firstEqIndex);
            var eqNum = remainingSelector.substring(firstEqIndex + 4, rightBracketIndex);
            eqNum = parseInt(eqNum, 10);

            var selectedElements = baseElement.querySelectorAll(leftSelector);
            if (eqNum >= selectedElements.length) {
               return [];
            }
            baseElement = selectedElements[eqNum];

            remainingSelector = remainingSelector.substring(rightBracketIndex + 1).trim();
            // Note - for now we just ignore direct descendants:
            // 'a:eq(0) > i' gets transformed into 'a:eq(0) i'; we could maybe use :scope
            // to fix this later but support is iffy
            if (remainingSelector.charAt(0) === '>') {
                remainingSelector = remainingSelector.substring(1).trim();
            }

            firstEqIndex = remainingSelector.indexOf(':eq(');
        }

        if (remainingSelector !== '') {
            return Array.from(baseElement.querySelectorAll(remainingSelector));
        }

        return [baseElement];
    }
    _querySelectorAllWithContents  (testName, assert, selector) {
        // eg: ".class:contents()[0]->1" selects the first contents of the 'class' class, with an offset of 1
        var wysiwyg = document.getElementsByTagName('we3-editor')[0];
        var sel = selector.match(reDOMSelection);
        try {
            var node = this._querySelectorAllWithEq(sel[1], wysiwyg)
            // var node = wysiwyg.querySelectorAll(sel[1]);
        } catch (e) {
            console.error(e);
            assert.notOk(e.message, testName);
            var node = $(sel[1], wysiwyg);
        }
        node = node[0];
        var point = {
            node: sel[3] ? node.childNodes[+sel[4]] : node,
            offset: sel[5] ? +sel[6] : 0
        };
        if (!point.node || point.offset > (point.node.tagName ? point.node.childNodes : point.node.textContent).length) {
            assert.notOk("Node not found: '" + selector + "' " + (point.node ? "(container: '" + (node.outerHTML || node.textContent) + "')" : ""), testName);
        }
        return point;
    }
    _endOfAreaBetweenTwoNodes  (point) {
        // move the position because some browsers put the carret at the end of the previous area after normalize
        if (
            !point.node.tagName &&
            point.offset === point.node.textContent.length &&
            !/\S|\u00A0/.test(point.node.textContent)
        ) {
            var startNode = point.node;
            point = Object.assing({}, point).nextUntilNode(function (node) {
                return node !== startNode && (!node.tagName || !node.textContent.length);
            }) || point;
        }
        return point;
    }
};

we3.addPlugin('TestToolbar', TestToolbar);

})();
