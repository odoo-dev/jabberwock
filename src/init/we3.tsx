(function () {
'use strict';

var we3Classes = window.we3;
var we3 = window.we3 = class we3 extends we3Classes.EventDispatcher {
    constructor (parent, params) {
        super(parent, params);
        this._editor = new we3Classes.Editor(parent, params);
    }

    cancel () {
        return this._editor.cancel();
    }
    destroy () {
        return this._editor.destroy();
    }
    get editor () {
        return this._editor.editor;
    }
    focus () {
        return this._editor.focus();
    }
    get isDirty () {
        return this._editor.isDirty();
    }
    isInitialized () {
        return this._editor.isInitialized();
    }
    get options () {
        return this._editor.options;
    }
    /**
     * Reset the value (or force a new value) and mark the editor as not dirty
     *
     **/
    reset (value) {
        return this._editor.reset(value);
    }
    save () {
        return this._editor.save();
    }
    start (element) {
        return this._editor.start(element);
    }
    get value () {
        return this._editor.getValue();
    }
    /**
     * Update the value and mark the editor as dirty
     *
     **/
    set value (value) {
        this._editor.setValue(value);
    }
};

we3.options = we3Classes.options;
we3.tags = we3Classes.tags;
we3.utils = we3Classes.utils;
we3.addPlugin = we3Classes.addPlugin;
we3.getPlugin = we3Classes.getPlugin;
we3.addArchNode = we3Classes.addArchNode;
we3.getArchNode = we3Classes.getArchNode;

we3.AbstractPlugin = we3Classes.AbstractPlugin;

Object.freeze(we3.AbstractPlugin.prototype);

we3.ArchNode = we3Classes.ArchNode;
we3.ArchNodeText = we3Classes.ArchNodeText;
we3.ArchNodeFragment = we3Classes.ArchNodeFragment;
we3.ArchNodeVirtualText = we3Classes.ArchNodeVirtualText;

we3.ClassName = we3Classes.ClassName;
we3.Style = we3Classes.Style;

// we3.TestContainerNode = we3Classes.TestContainerNode;
// we3.TestNode = we3Classes.TestNode;

Object.freeze(we3.ArchNode.prototype);
Object.freeze(we3.ArchNodeText.prototype);
Object.freeze(we3.ArchNodeFragment.prototype);
Object.freeze(we3.ArchNodeVirtualText.prototype);
// Object.freeze(we3);

})();
