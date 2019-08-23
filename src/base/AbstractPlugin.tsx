(function () {
'use strict';

//--------------------------------------------------------------------------
// AbstractPlugin for summernote module API
//--------------------------------------------------------------------------

we3.AbstractPlugin = class extends we3.EventDispatcher {
    /**
     * @returns {false|string[]}
     */
    static get autoInstall () {
        return false;
    }
    /**
     * Use this prop if you want to extend a summernote plugin.
     *
     * @params {object} parent
     * @params {object} params
     * @params {int} params.id
     * @params {array} params.plugins
     * @params {Node} params.editable
     * @params {function} params.addEditableContainer
     * @params {function} params.insertBeforeEditable
     * @params {function} params.insertAfterEditable
     */
    constructor (parent, params, options) {
        super(...arguments);
        this.editorId = params.id;
        this.params = params;
        this.options = options;
        this.editable = params.editable;
        this.utils = we3.utils;

        this.templatesDependencies = [];
        this.dependencies = [];

        this.documentDomEvents = null;
        this.editableDomEvents = null;
        this.pluginEvents = null;

        this._eventToRemoveOnDestroy = [];
    }
    /**
     * @see Manager.isInitialized
     */
    isInitialized () {
        return Promise.resolve();
    }
    /**
     * @see Manager.start
     */
    willStart () {
        return Promise.resolve();
    }
    /**
     * @see Manager.start
     */
    start () {
        this._bindSelfEvents(this.pluginEvents);
        this._bindDOMEvents(window.top.document, this.documentDomEvents);
        this._bindDOMEvents(this.editable, this.editableDomEvents);
        return Promise.resolve();
    }
    destroy () {
        this._eventToRemoveOnDestroy.forEach(function (event) {
            event.target.removeEventListener(event.name, event.value);
        });
        super.destroy();
    }

    //--------------------------------------------------------------------------
    // Editor methods
    //--------------------------------------------------------------------------

    /**
     * Override any of these functions from within a plugin to allow it to add specific
     * behavior to any of these basic functions of the editor (eg modifying the value
     * to save, then passing to the next plugin's saveEditor override etc.).
     */

    /**
     * @see Manager.blurEditor
     */
    blurEditor () {}
    /**
     * @see Manager.cancelEditor
     */
    cancelEditor () {
        return Promise.resolve();
    }
    /**
     * @see Manager.changeEditorValue
     *
     * @param {Object[]} changes
     */
    changeEditorValue (changes) {}
    /**
     * @see Manager.focusEditor
     */
    focusEditor () {}
    /**
     * @see Manager.getEditorValue
     */
    getEditorValue (value) {
        return value;
    }
    /**
     * Note: Please only change the string value without using the DOM.
     * The value is received from getEditorValue.
     *
     * @see Manager.saveEditor
     */
    saveEditor (value) {
        return Promise.resolve(value);
    }
    /**
     * @see Manager.setEditorValue
     */
    setEditorValue () {
    }
    /**
     * @see Manager.translatePluginString
     */
    translatePluginTerm (pluginName, value, originalValue, elem, attributeName) {
        return value;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Used after the start, don't ovewrite it
     *
     * @see Manager.start
     * @private
     * @param {Node} editor
     */
    _afterStartAddDomReferences (editor) {
        this.document = this.editable.ownerDocument;
        this.window = this.document.defaultView;
        this.editor = editor;
    }
    /**
     * Bind DOM events declared in the plugin
     * (`editableDomEvents`, `documentDomEvents`)
     * with their respective node (`dom`).
     *
     * FIXME the event delegation does not work... do we really want to
     * implement that ourself ?
     *
     * @private
     * @param {Node} dom
     * @param {Object []} events {[name]: {String}}
     */
    _bindDOMEvents (dom, events) {
        var self = this;
        Object.keys(events || {}).forEach(function (event) {
            var value = events[event];
            if (!value) {
                return;
            }
            var eventName = event.split(' ')[0];
            var selector = event.split(' ').slice(1).join(' ');
            if (typeof value === 'string') {
                value = self[value];
            }
            value = value.bind(self);
            if (selector) {
                var _value = value;
                value = function (ev) {
                    if ([].indexOf.call(dom.querySelectorAll(selector), ev.target || ev.relatedNode) !== -1) {
                        _value(ev);
                    }
                };
            }
            if (eventName === 'mousemove' || eventName === 'scroll') {
                value = self._throttled(6, value);
            }

            self._eventToRemoveOnDestroy.push({
                target: dom,
                name: eventName,
                value: value,
            });
            dom.addEventListener(eventName, value, false);
        });
    }
    /**
     * Bind custom plugin events declared in the plugin
     * (`pluginEvents`) with the plugin.
     *
     * @private
     * @param {Object []} events {[name]: {String}}
     */
    _bindSelfEvents (events) {
        var self = this;
        Object.keys(events || {}).forEach(function (key) {
            var value = events[key];
            if (typeof value === 'string') {
                if (!self[value]) {
                    throw new Error("Unknown method '" + name + "' to bind on the plugin '" + self.pluginName + '"');
                }
                value = self[value].bind(self);
            }
            self.on(key, self, value);
        });
    }
    /**
     * Render a template for the plugin and return it as a Fragment.
     *
     * @private
     * @param {String} template
     * @returns {Fragment}
     */
    _renderTemplate (template, values) {
        var self = this;
        var fragment = document.createDocumentFragment();
        var temp = document.createElement('TEMP');
        temp.innerHTML = this.options.renderTemplate(this.pluginName, template, values);

        temp.querySelectorAll('[data-method]').forEach(function (node) {
            var methodName = node.getAttribute('data-method');
            if (!self[methodName]) {
                throw new Error("The template '" + template + "' try to call an undefined method '" + methodName + "' on the plugin '" + self.pluginName + "'");
            }
            if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT' || node.tagName === 'SELECT') {
                node.addEventListener('input', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!ev.target.getAttribute('disabled')) {
                        self[methodName](this.value, ev);
                    }
                });
                node.addEventListener('change', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!ev.target.getAttribute('disabled')) {
                        self[methodName](this.value, ev);
                    }
                }, false);
            } else {
                node.addEventListener('mousedown', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!ev.target.getAttribute('disabled')) {
                        self[methodName](this.hasAttribute('data-value') ? this.getAttribute('data-value') : undefined, ev);
                    }
                }, false);
            }
        });

        [].slice.call(temp.childNodes).forEach(function (child) {
            fragment.appendChild(child);
        });
        return fragment;
    }
    /**
     * Throttle a function call.
     *
     * @private
     * @param {Integer} delay
     * @param {Function} fn
     * @returns {Function}
     */
    _throttled  (delay, fn) {
        var  lastCall = 0;
        return function () {
            var args = arguments;
            var now = new Date().getTime();
            if (now - lastCall < delay) {
                return;
            }
            lastCall = now;
            return fn.apply(null, args);
        }
    }
};

})();
