(function () {
'use strict';

var id = 0;
var PluginsManager = we3.PluginsManager;
var utils = we3.utils;

we3.Editor = class extends we3.EventDispatcher {
    /**
     * @constructor
     */
    constructor(parent, params) {
        super(parent);
        if (!params) {
            params = parent;
            parent = null;
        }
        var self = this;
        this.editorEvents = {
            'touchstart document': '_onMouseDown',
            'mousedown document': '_onMouseDown',
            'mouseenter document': '_onMouseEnter',
            'mouseleave document': '_onMouseLeave',
            'mousemove document': '_onMouseMove',
            'blur editable': '_onBlurEditable',
            'focus editable': '_onFocusEditable',
            'paste editable': '_onPaste',
        };
        this._templates = {};
        this.id = 'wysiwyg-' + (++id);

        // nby review: could be in the renderer
        // editorElement instead of editor (finish all element by "Element")
        this.editor = document.createElement('we3-editor');
        this.editorMainRow = document.createElement('we3-editor-main-row');
        this.container = document.createElement('we3-editable-container');
        this.editable = document.createElement('we3-editable');
        this.editable.contentEditable = 'true';

        this._editableContainer = [];
        this.beforeMainRow = [];
        this.afterMainRow = [];
        this.beforeContainer = [];
        this.afterContainer = [];
        this.beforeEditable = [];
        this.afterEditable = [];

        this._saveEventMethods();
        this._prepareOptions(params);

        this._pluginsManager = new PluginsManager(this, {
            id: this.id,
            plugins: this.plugins,
            editable: this.editable,
            editor: this.editor,
            addEditableContainer(node) {
                if (self._isInsertEditableInContainers) {
                    throw new Error("Plugin content already inserted, you can't change the container");
                } else {
                    self._editableContainer.push(node);
                }
            },
            insertBeforeMainRow(node) {
                if (self._editorMainRowInserted) {
                    self.editor.insertBefore(node, self.editor.firstChild);
                } else {
                    self.beforeMainRow.push(node);
                }
            },
            insertAfterMainRow(node) {
                if (self._editorMainRowInserted) {
                    self.editor.appendChild(node);
                } else {
                    self.afterMainRow.push(node);
                }
            },
            insertBeforeContainer(node) {
                if (self._isInsertEditableContainers) {
                    self.editorMainRow.insertBefore(node, self.editor.firstChild);
                } else {
                    self.beforeContainer.push(node);
                }
            },
            insertAfterContainer(node) {
                if (self._isInsertEditableContainers) {
                    self.editorMainRow.appendChild(node);
                } else {
                    self.afterContainer.push(node);
                }
            },
            insertBeforeEditable(node) {
                if (self._isInsertEditableInContainers) {
                    self.editable.parentNode.insertBefore(node, self.editable.parentNode.firstChild);
                } else {
                    self.beforeEditable.push(node);
                }
            },
            insertAfterEditable(node) {
                if (self._isInsertEditableInContainers) {
                    self.editable.parentNode.appendChild(node);
                } else {
                    self.afterEditable.push(node);
                }
            },
        }, this.options);

        // nby review: what is is doing?
        this.on('change', this, this._onChange);
    }
    /**
     * @override
     */
    start(target) {
        var self = this;
        if (target.wysiwygEditor) {
            target.wysiwygEditor.destroy();
        }
        this.target = target;
        this.target.wysiwygEditor = this;
        this.target.dataset.dataWysiwygId = this.id;

        this.on('command', this, function () { throw new Error(); });
        this.on('get_value', this, this._onGetValue);
        this.on('set_value', this, this._onSetValue);

        return this.isInitialized().then(function () {
            if (self.isDestroyed()) {
                return;
            }
            self._insertEditorMainRow();
            self._insertEditorContainers();
            self._insertEditableInContainers();

            self.editor.style.display = 'none';
            self.editor.id = self.id;
            if (self.target.nextSibling) {
                self.target.parentNode.insertBefore(self.editor, self.target.nextSibling);
            } else if (self.target.parentNode) {
                self.target.parentNode.appendChild(self.editor);
            } else {
                console.info("Can't insert this editor on a node without any parent");
            }

            return self._pluginsManager.start();
        }).then(function () {
            if (self.isDestroyed()) {
                return;
            }
            self._afterstartallplugins();
            if (self.target.tagName !== "TEXTAREA") {
                self._targetID = self.target.id;
                self._targetClassName = self.target.className;
                self.target.removeAttribute('id');
                self.editable.setAttribute('id', self._targetID);
                self.editable.className = self._targetClassName;
            }
        });
    }
    destroy () {
        if (this.editor && this.editor.parentNode) {
            this.editor.parentNode.removeChild(this.editor);
        }
        if (this.target) {
            this.target.wysiwygEditor = null;
            if (this.target.tagName !== "TEXTAREA") {
                this.target.setAttribute('id', this._targetID);
                this.target.style.display = '';
            }
        }
        this._destroyEvents();
        super.destroy();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Cancel the edition and destroy the editor.
     */
    cancel () {
        this._pluginsManager.cancelEditor();
        this.destroy();
    }
    /**
     * Set the focus on the editable element.
     */
    focus () {
        this.editable.focus();
    }
    /**
     * Get the value of the editable element.
     *
     * @param {object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @param {boolean} [options.showIDs] true to show the arch node id's
     * @returns {string}
     */
    getValue (options) {
        return this._pluginsManager.getEditorValue(options);
    }
    /**
     * Return true if the content has changed.
     *
     * @returns {Boolean}
     */
    isDirty () {
        var isDirty = this._value !== this.getValue();
        if (!this._dirty && isDirty) { // TODO remove, it's impossible...
            console.warn("not dirty flag ? Please fix it.");
        }
        return isDirty;
    }
    /**
     * Return a Promise resolved when the plugin is initialized and can be started
     * This method can't start new call or perform calculations, must just return
     * the deferreds created in the init method.
     *
     * @returns {Promise}
     */
    // nby review: not is... as this is not returing a boolean
    isInitialized () {
        return this._pluginsManager.isInitialized();
    }
    /**
     * Reset the editor with the given value if any.
     *
     * @param {String} [value]
     */
    reset (value) {
        this._value = value || this._value;
        this._pluginsManager.setEditorValue(this._value);
        this._dirty = false;
    }
    /**
     * Save the content in the target
     *      - in init option beforeSave
     *      - receive editable jQuery DOM as attribute
     *      - called after deactivate codeview if needed
     * @returns {Promise}
     *      - resolve with {isDirty, value, arch}
     */
    save () {
        var self = this;
        var isDirty = this.isDirty();
        return this._pluginsManager.saveEditor().then(function (arch) {
            var html = arch.toString();
            if (self.target.tagName === "TEXTAREA") {
                self.target.value = html;
            } else {
                self.target.innerHTML = html;
            }
            return {
                isDirty: isDirty,
                value: html,
                arch: arch,
            };
        });
    }
    /**
     * Set the value of the editor.
     *
     * @param {String} value
     */
    setValue (value) {
        this._pluginsManager.setEditorValue(value || '');
        this.triggerUp('change');
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Method to call after completion of the `start` method.
     *
     * @private
     */
    _afterStartAllPlugins () {
        this.target.style.display = 'none';
        this.editor.style.display = '';
        var value = this.target[this.target.tagName === "TEXTAREA" ? 'value' : 'innerHTML'];
        this.reset(value);
        this._bindEvents();
    }
    /**
     * Bind the events defined in the editorEvents property.
     *
     * @private
     */
    _bindEvents () {
        var self = this;
        this.editorEvents.forEach(function (event) {
            if (event.target === 'document') {
                window.top.document.addEventListener(event.name, event.method, true);
                self.editable.ownerDocument.addEventListener(event.name, event.method, false);
            } else {
                self[event.target].addEventListener(event.name, event.method, false);
            }
        });
    }
    /**
     * Destroy all events defined in `editorEvents`.
     *
     * @private
     */
    _destroyEvents () {
        var self = this;
        this.editorEvents.forEach(function (event) {
            if (event.target === 'document') {
                window.top.document.removeEventListener(event.name, event.method, true);
                self.editable.removeEventListener(event.name, event.method, false);
            } else {
                self[event.target].removeEventListener(event.name, event.method, false);
            }
        });
    }
    /**
     * Return a list of the descendents of the current object.
     *
     * @private
     */
    _getDecendents () {
        var children = this.getChildren();
        var descendents = [];
        var child;
        while ((child = children.pop())) {
            descendents.push(child);
            children = children.concat(child.getChildren());
        }
        return descendents;
    }
    /**
     * @private
     * @param {string} pluginName
     * @param {string} url
     * @param {any} values
     * @returns {Promise}
     */
    _getXHR (pluginName, url, values) {
        url = url[0] === '/' ? url : this.options.xhrPath + url;
        return new Promise(function (resolve) {
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function (html) {
                resolve(this.responseText);
            });
            oReq.addEventListener("error", resolve);
            var getValues = Object.keys(values || {}).map(function (key) {
                return escape(key) + '=' + escape(values[key]);
            });
            oReq.open("GET", url + (getValues.length ? '?' + getValues.join('&') : ''));
            oReq.send();
        });
    }
    /**
     * @private
     */
    _insertEditorMainRow() {
        this._editorMainRowInserted = true;

        var node = this.beforeMainRow.pop();
        while (node) {
            this.editor.appendChild(node);
            node = this.beforeMainRow.pop();
        }

        this.editor.appendChild(this.editorMainRow);

        node = this.afterMainRow.pop();
        while (node) {
            this.editor.appendChild(node);
            node = this.afterMainRow.pop();
        }
    }
    /**
     * @private
     */
    _insertEditorContainers() {
        this._isInsertEditableContainers = true;

        var node = this.beforeContainer.pop();
        while (node) {
            this.editorMainRow.appendChild(node);
            node = this.beforeContainer.pop();
        }

        var editableContainer = this.editorMainRow;
        node = this._editableContainer.shift();
        while (node) {
            editableContainer.appendChild(node);
            editableContainer = node;
            node = this._editableContainer.shift();
        }

        editableContainer.appendChild(this.container);

        node = this.afterContainer.pop();
        while (node) {
            this.editorMainRow.appendChild(node);
            node = this.afterContainer.pop();
        }
    }
    /**
     * @private
     */
    _insertEditableInContainers() {
        this._isInsertEditableInContainers = true;

        var node = this.beforeEditable.pop();
        while (node) {
            this.container.appendChild(node);
            node = this.beforeEditable.pop();
        }

        this.container.appendChild(this.editable);

        node = this.afterEditable.shift();
        while (node) {
            this.container.appendChild(node);
            node = this.afterEditable.shift();
        }
    }
    /**
     * Return true if the given node is in the editor.
     * Note: a button in the MediaDialog returns true.
     *
     * @private
     * @param {Node} node
     * @returns {Boolean}
     */
    _isEditorContent (node) {
        if (this.editor === node || this.editor.contains(node)) {
            return true;
        }

        var descendents = this._getDecendents().map(function (obj) {
            return Object.values(obj);
        });
        descendents = utils.uniq(utils.flatten(descendents));
        var childrenDom = descendents.filter(function (pluginNode) {
            return pluginNode && pluginNode.DOCUMENT_NODE &&
                pluginNode.tagName && pluginNode.tagName !== 'BODY' && pluginNode.tagName !== 'HTML' &&
                pluginNode.contains(node);
        });
        return !!childrenDom.length;
    }
    /**
     * @private
     * @param {string[]} templatesDependencies
     * @returns {Promise}
     */
    _loadTemplates (templatesDependencies) {
        var xmlPath;
        var promises = [];
        var _onLoadTemplates = this._onLoadTemplates.bind(this);
        while ((xmlPath = templatesDependencies.shift())) {
            promises.push(null, this.options.getXHR(xmlPath).then(_onLoadTemplates));
        }
        return Promise.all(promises);
    }
    /**
     * @private
     */
    _mouseEventFocus () {
        this._onMouseDownTime = null;
        if (!this._editableHasFocus && !this._isEditorContent(document.activeElement)) {
            this.editable.focus();
        }
        if (!this._isFocused) {
            this._isFocused = true;
            this._onFocus();
        }
    }
    /**
     * @private
     * @param {Object} params
     */
    _prepareOptions (params) {
        var self = this;
        params = utils.deepClone(params);
        var defaults = (function def (defaults) {
            defaults = defaults && defaults.slice ? defaults.slice() : Object.assign({}, defaults);
            Object.keys(defaults).forEach(function (key) {
                var val = defaults[key];
                if (val && typeof val === 'object' && !('ignoreCase' in val && val.test) && (typeof val.style !== "object" || typeof val.ownerDocument !== "object")) {
                    defaults[key] = def(val);
                }
            });
            return defaults;
        })(we3.options);
        utils.defaults(params, defaults);
        utils.defaults(params.env, defaults.env);
        utils.defaults(params.plugins, defaults.plugins);
        utils.defaults(params, {
            loadTemplates: this._loadTemplates.bind(this),
            renderTemplate: this._renderTemplate.bind(this),
            translateTemplateNodes: this._translateTemplateNodes.bind(this),
            translate: this._translateString.bind(this),
        });

        var superGetXHR = this._getXHR.bind(this);
        var getXHR = params.getXHR || superGetXHR;
        params.getXHR = function (pluginName, url, values) {
            return getXHR(pluginName, url, values, superGetXHR);
        };

        var renderTemplate = params.renderTemplate;
        params.renderTemplate = function (pluginName, template, values) {
            var fragment = document.createElement('we3-fragment');
            fragment.innerHTML = renderTemplate(pluginName, template, values);
            self.options.translateTemplateNodes(pluginName, fragment);
            return fragment.innerHTML;
        },
        params.hasFocus = function () {return self._isFocused;};

        this.plugins = params.plugins;
        delete params.plugins;
        this.options = utils.deepFreeze(utils.deepClone(params));
    }
    /**
     * @private
     * @param {string} pluginName
     * @param {string} template
     * @param {any} values
     * @returns {string}
     */
    _renderTemplate (pluginName, template, values) {
        if (!(template in this._templates)) {
            throw new Error('Template "' + template + '" not found.');
        }
        return this._templates[template];
    }
    /**
     * Save all event methods defined in editorEvents for safe destruction.
     *
     * @private
     */
    _saveEventMethods () {
        var self = this;
        var events = [];
        Object.keys(this.editorEvents).forEach(function (key) {
            var parts = key.split(' ');
            events.push({
                name: parts[0],
                target: parts[1],
                method: self[self.editorEvents[key]].bind(self),
            });
        });
        this.editorEvents = events;
    }
    /**
     * @private
     * @param {string} pluginName
     * @param {string} string
     * @returns {string}
     */
    _translateString (pluginName, string) {
        string = string.replace(/\s\s+/g, ' ');
        if (this.options.lang && this.options.lang[string]) {
            return this.options.lang[string];
        }
        console.warn("Missing translation: " + string);
        return string;
    }
    /**
     * @private
     * @param {string} pluginName
     * @param {element} node
     * @returns {string}
     */
    _translateTemplateNodes (pluginName, node) {
        var self = this;
        var regExpText = /^([\s\n\r\t]*)(.*?)([\s\n\r\t]*)$/;
        var attributesToTranslate = ['title', 'alt', 'help', 'placeholder', 'aria-label'];
        (function translateNodes(elem) {
            if (elem.attributes) {
                Object.values(elem.attributes).forEach(function (attribute) {
                    if (attributesToTranslate.indexOf(attribute.name) !== -1) {
                        var text = attribute.value.match(regExpText);
                        if (text && text[2].length) {
                            var value = text[1] + self.options.translate(pluginName, text[2]) + text[3];
                            value = self._pluginsManager.translatePluginString(pluginName, value, text[2], elem, attribute.name);
                            attribute.value = value;
                        }
                    }
                });
            }

            var nodes = elem.childNodes;
            var i = nodes.length;
            while (i--) {
                var node = nodes[i];
                if (node.nodeType == 3) {
                    var text = node.nodeValue.match(regExpText);
                    if (text && text[2].length) {
                        var value = text[1] + self.options.translate(pluginName, text[2]) + text[3];
                        value = self._pluginsManager.translatePluginString(pluginName, value, text[2], node, 'nodeValue');
                        node.nodeValue = value;
                    }
                } else if (node.nodeType == 1 || node.nodeType == 9 || node.nodeType == 11) {
                    translateNodes(node);
                }
            }
        })(node);
    }
    /**
     * Return the last added, non-null element in an array.
     *
     * @private
     * @param {any []} array
     * @returns {any}
     */
    // nby review: this is an utility function
    _unstack (array) {
        var result = null;
        for (var k = array.length - 1; k >= 0; k--) {
            if (array[k] !== null) {
                result = array[k];
                break;
            }
        }
        return result;
    }

    //--------------------------------------------------------------------------
    // Handler
    //--------------------------------------------------------------------------

    /**
     * triggerUp 'blur'.
     *
     * @private
     * @param {Object} [options]
     */
    // nby review: could be called _blurEditor?
    _onBlur (options) {
        // nby review: this is passive
        this._pluginsManager.blurEditor();
        this.triggerUp('blur', options);
    }
    /**
     * @private
     */
    // nby review: what is the diferrence between _onBlur and this one?
    _onBlurEditable () {
        var self = this;
        this._editableHasFocus = false;
        if (!this._isFocused) {
            return;
        }
        if (!this._justFocused && !this._mouseInEditor) {
            if (this._isFocused) {
                this._isFocused = false;
                this._onBlur();
            }
        } else if (!this._forceEditableFocus) {
            this._forceEditableFocus = true;
            setTimeout(function () {
                if (!self._isEditorContent(document.activeElement)) {
                    self.editable.focus();
                }
                self._forceEditableFocus = false; // prevent stack size exceeded.
            });
        } else {
            this._mouseInEditor = null;
        }
    }
    /**
     * @private
     */
    // nby review: what is this onchange?
    _onChange () {
        this._dirty = true;
    }
    /**
     * what is this comment?
     * triggerUp 'wysiwyg_focus'.
     *
     * @private
     * @param {Object} [options]
     */
    _onFocus (options) {
        this._pluginsManager.focusEditor();
        this.triggerUp('focus', options);
    }
    /**
     * @private
     * @param {Event} ev
     */
    _onFocusEditable () {
        var self = this;
        this._editableHasFocus = true;
        this._justFocused = true;
        setTimeout(function () {
            self._justFocused = true;
        });
    }
    /**
     * @private
     * @param {OdooEvent} ev
     * @return {any}
     */
    _onGetValue (ev) {
        ev.stopPropagation();
        return ev.data.callback(this.getValue(ev.data.options || {}));
    }
    /**
     * @private
     * @param {string} html
     */
    // nby review: should be called _loadTemplates
    _onLoadTemplates (html) {
        var self = this;
        var fragment = document.createElement('we3-fragment');
        fragment.innerHTML = html;
        fragment.querySelectorAll('[t-name]').forEach(function (template) {
            var templateName = template.getAttribute('t-name');
            template.removeAttribute('t-name');
            self._templates[templateName] = template.tagName === 'T' ? template.innerHTML : template.outerHTML;
        });
    }
    /**
     * @private
     * @param {Event} ev
     */
    _onMouseDown (ev) {
        if (this._isEditorContent(ev.target)) {
            this._mouseEventFocus();
            this._onMouseDownTime = setTimeout(this._mouseEventFocus.bind(this));
        } else if (this._isFocused) {
            this._isFocused = false;
            this._onBlur();
        }
    }
    /**
     * @private
     * @param {Event} ev
     */
    _onMouseEnter (ev) {
        if (this._isFocused && !this._mouseInEditor && this._isEditorContent(ev.target)) {
            this._mouseInEditor = true;
        }
    }
    /**
     * @private
     * @param {Event} ev
     */
    _onMouseLeave () {
        if (this._isFocused && this._mouseInEditor) {
            this._mouseInEditor = null;
        }
    }
    /**
     * @private
     * @param {Event} ev
     */
    _onMouseMove (ev) {
        if (this._mouseInEditor === null) {
            this._mouseInEditor = !!this._isEditorContent(ev.target);
        }
    }
    /**
     * @private
     * @param {OdooEvent} ev
     */
    _onPaste (ev) {
        ev.preventDefault();
    }
    /**
     * @private
     * @param {OdooEvent} ev
     */
    _onSetValue (ev) {
        ev.stopPropagation();
        this.setValue(ev.data.value);
    }
};

})();
