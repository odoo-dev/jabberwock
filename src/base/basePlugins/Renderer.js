(function () {
'use strict';

var BaseRenderer = class extends we3.AbstractPlugin {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get a rendered node from its ID in the Arch.
     *
     * @param {int} id
     * @returns {Node}
     */
    getElement (id, insertIfMissing) {
        if (insertIfMissing) {
            this._insertInEditable(this.jsonById[id]);
        }
        return this.elements[id];
    }
    /**
     * Get the ID in the Arch of a rendered Node.
     *
     * @param {Node} element
     */
    getID (element, insertIfMissing) {
        var index = this.elements.indexOf(element);
        var id = index === -1 ? null : index;
        if (id && insertIfMissing) {
            this._insertInEditable(this.jsonById[id]);
        }
        return id;
    }
    markAsDirty (id, options) {
        options = options || {};
        this.changes[id] = Object.assign({}, this.changes[id]);
        if (options.childNodes && ('childNodes' in this.jsonById[id])) {
            this.changes[id].childNodes = this.changes[id].childNodes || this.jsonById[id].childNodes;
        }
        if (options.nodeValue && ('nodeValue' in this.jsonById[id])) {
            this.changes[id].nodeValue = this.changes[id].nodeValue || this.jsonById[id].nodeValue;
        }
        if (options.attributes && ('attributes' in this.jsonById[id])) {
            this.changes[id].attributes = this.changes[id].attributes || this.jsonById[id].attributes;
        }
    }
    /**
     * Render the changes.
     *
     * @param {Object} [options]
     * @param {Boolean} [options.showIDs]
     */
    redraw (options) {
        this._redraw(Object.assign({}, {
            forceDirty: true,
        }, options));
    }
    /**
     * Reset the DOM, with a starting DOM if `json` is passed.
     *
     * @param {JSON} [json]
     * @param {Object} [options]
     * @param {Boolean} [options.showIDs]
     */
    reset (json, options) {
        this.changes = {};
        this.jsonById = [null, {
            id: 1,
            childNodes: [],
        }];
        this.elements = [null, this.editable];

        if (json) {
            this.update(json, options);
        }
    }
    /**
     * Update the DOM with the changes specified in `newJSON`.
     *
     * @param {JSON} newJSON
     * @param {Object} [options]
     * @param {Boolean} [options.forceDirty]
     * @param {Boolean} [options.showIDs]
     */
    update (newJSON, options) {
        if (newJSON.forEach) {
            newJSON.forEach(this._makeDiff.bind(this));
        } else {
            this._makeDiff(newJSON);
        }
        this._clean();
        this._redraw(options);
        this._cleanElements();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the IDs of the node corresponding to the given `id`,
     * and all its descendents.
     *
     * @private
     * @param {int} id
     * @param {int []} [ids]
     * @returns {int []}
     */
    _allIds (id, ids) {
        var json = this.jsonById[id];
        ids = ids || [];
        if (ids[id]) {
            throw new Error('Some nodes appear several times in the arch');
        }
        ids[id] = id;
        if (json.childNodes) {
            for (var k = 0; k < json.childNodes.length; k++) {
                var childID = json.childNodes[k];
                this.jsonById[childID].parentID = json.id;
                this._allIds(childID, ids);
            }
        }
        return ids;
    }
    _childLink (ids, childNodes) {
        var self = this;
        ids.forEach(function (id, index) {
            var json = self.jsonById[id];
            if (!json.nodeValue) {
                return;
            }
            var el = self.elements[id];
            if (el) {
                if (el.textContent === json.nodeValue) {
                    return;
                }
                for (var k = index; k < childNodes.length; k++) {
                    if (!el.tagName && el.textContent === json.nodeValue) {
                        var oldId = this.getID(el);
                        if (oldId) {
                            var oldJson = self.jsonById[oldId];
                            if (el.textContent === oldJson.nodeValue) {
                                continue;
                            }
                            delete self.elements[oldId];
                        }
                        self.elements[id] = el;
                    }
                }
            }
        });
    }
    /**
     * Remove all DOM references.
     *
     * @private
     */
    _clean () {
        var self = this;
        var ids = this._allIds(1);
        this.jsonById.forEach(function (json, id) {
            if (!ids[id] && self.jsonById[id]) {
                delete self.jsonById[id];
                delete self.elements[id];
            }
        });
    }
    /**
     * Remove all nodes that are not in the Arch from the DOM.
     *
     * @private
     */
    _cleanElements () {
        var els = [];
        (function _getAll(el) {
            if (el.tagName && el.tagName.indexOf('WE3-') === 0) {
                if (el.tagName === "WE3-EDITABLE") {
                    el.childNodes.forEach(_getAll);
                }
                return;
            }
            els.push(el);
            el.childNodes.forEach(_getAll);
        })(this.editable);

        var inArch = this.elements;
        els.forEach(function (el) {
            if (inArch.indexOf(el) === -1) {
                el.parentNode.removeChild(el);
            }
        });
    }
    _createElement (json) {
        var el;
        if (json.nodeValue) {
            el = document.createTextNode(json.nodeValue);
        } else if (json.nodeName) {
            el = document.createElement(json.nodeName);
        }
        this.elements[json.id] = el;
        return el;
    }
    /**
     * Get a Node by the ID of its corresponding ArchNode.
     *
     * @private
     * @param {int} id
     * @param {Node} [target]
     * @returns {Node}
     */
    _getElement (id, target, dontCheckParent) {
        if (id === 1) {
            return this.editable;
        }

        var json = this.jsonById[id];
        var el = this.elements[id];
        var freeElement = target && target !== el && !this.getID(target) ? target : null;

        if (!el && freeElement) {
            el = freeElement;
        }

        if (!el) {
            el = this._createElement(json);
        } else if (el === freeElement) { // virtual node can mutate or try to use a free element
            if ('nodeValue' in json && !json.nodeName) {
                if (el.tagName) {
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                    el = document.createTextNode(json.nodeValue);
                }
            } else if (json.nodeName && (!el.tagName || el.tagName.toLowerCase() !== json.nodeName)) {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                el = document.createElement(json.nodeName);
            }
            this.elements[id] = el;
        }

        this._insertInEditable(json, dontCheckParent);

        return el;
    }
    _insertInEditable (json, dontCheckParent) {
        if (json && json.id === 1) {
            return;
        }

        var self = this;
        var parent = dontCheckParent && this.elements[json.parentID] || this._getElement(json.parentID, null, true);
        var parentJSON = this.jsonById[json.parentID];
        var index = parentJSON.childNodes.indexOf(json.id);
        var el = this.elements[json.id];
        var child = parent.childNodes[index];
        if (el === child) {
            return;
        }

        var childID = this.getID(child);
        if (!child) {
            if (!el) {
                el = this._createElement(json);
            }
            parent.appendChild(el);
        } else if ((!child.tagName && !json.nodeName || child.nodeName.toLowerCase() === json.nodeName) && childID === -1) {
            if (childID !== -1) {
                delete this.elements[childID];
            }

            this.elements[json.id] = child;
            if (json.childNodes) {
                json.childNodes.forEach(function (id) {
                    self._insertInEditable(self.jsonById[id], true);
                });
            }

            if (childID !== -1) {
                this._getElement(childID, null, true);
            }
        } else {
            if (!el) {
                el = this._createElement(json);
            }
            parent.insertBefore(el, parent.childNodes[index]);
        }
    }
    /**
     * Update the `changes` with a JSON containing the differences between the previous state
     * and the new one.
     *
     * @private
     * @param {JSON} newJSON
     */
    _makeDiff (newJSON) {
        var oldJSON = this.jsonById[newJSON.id] = (this.jsonById[newJSON.id] || {id: newJSON.id});

        if (newJSON.nodeName && !oldJSON.nodeName) {
            oldJSON.nodeName = newJSON.nodeName;
        }

        var changes = {};
        if (oldJSON.nodeValue !== newJSON.nodeValue) {
            changes.nodeValue = newJSON.nodeValue;
            oldJSON.nodeValue = newJSON.nodeValue;
        }
        if (newJSON.attributes || oldJSON.attributes) {
            if (!oldJSON.attributes) {
                changes.attributes = newJSON.attributes.slice();
            } else {
                var attributes = [];
                newJSON.attributes = newJSON.attributes || [[]];
                oldJSON.attributes.forEach(function (attribute) {
                    for (var k = 0; k < newJSON.attributes.length; k++) {
                        if (newJSON.attributes[k][0] === attribute[0]) {
                            return;
                        }
                    }
                    attributes.push([attribute[0], false]);
                });
                (newJSON.attributes || []).slice().forEach(function (attribute) {
                    for (var k = 0; k < oldJSON.attributes.length; k++) {
                        if (oldJSON.attributes[k][0] === attribute[0]) {
                            if (oldJSON.attributes[k][1] === attribute[1]) {
                                return;
                            }
                            break;
                        }
                    }
                    attributes.push(attribute);
                });
                if (attributes.length) {
                    changes.attributes = attributes;
                }
            }
            oldJSON.attributes = newJSON.attributes.slice();
        }
        if (newJSON.childNodes || oldJSON.childNodes) {
            newJSON.childNodes = newJSON.childNodes || [];
            var childNodesIds = newJSON.childNodes.map(function (json) { return json.id; });

            if (!oldJSON.childNodes) {
                changes.childNodes = childNodesIds;
            } else if (oldJSON.childNodes.length !== newJSON.childNodes.length) {
                changes.childNodes = childNodesIds;
            } else {
                for (var k = 0; k < childNodesIds.length; k++) {
                    if (oldJSON.childNodes[k] !== childNodesIds[k]) {
                        changes.childNodes = childNodesIds;
                        break;
                    }
                }
            }
            newJSON.childNodes.forEach(this._makeDiff.bind(this));
            oldJSON.childNodes = childNodesIds;
        }

        if (Object.keys(changes).length) {
            this.changes[newJSON.id] = changes;
        }
    }
    /**
     * Mark all changed nodes as dirty.
     *
     * @private
     */
    _markAllDirty () {
        var self = this;
        this.jsonById.forEach(function (json, id) {
            var json = Object.assign({}, json);
            if (!json) {
                return;
            }
            self.changes[id] = json;
            if (json.childNodes) {
                json.childNodes = json.childNodes.map(function (json) {
                    return json.id || json;
                });
            }
        });
    }
    /**
     * Render the changes.
     *
     * @private
     * @param {Object} [options]
     * @param {Boolean} [options.forceDirty]
     * @param {Boolean} [options.showIDs]
     */
    _redraw (options) {
        var self = this;
        options = options || {};

        if (options.forceDirty) {
            this._markAllDirty();
        } else {
            this.elements.forEach(function (el, id) {
                if (el && !self.editable.contains(el)) {
                    self.markAsDirty(id);
                }
            })
        }

        Object.keys(this.changes).forEach(function (id) {
            var changes = self.changes[id];
            delete self.changes[id];
            if (self.jsonById[id]) {
                self._redrawOne(self.jsonById[id], changes, options);
            }
        });
    }
    /**
     * Render one node from changes.
     *
     * @private
     * @param {JSON} json
     * @param {JSON} changes
     * @param {Object} [options]
     * @param {Boolean} [options.showIDs]
     * @returns {Node}
     */
    _redrawOne (json, changes, options) {
        var self = this;
        options = options || {};
        var node;
        if (json.isVirtual && !options.keepVirtual) {
            node = document.createDocumentFragment();
        } else {
            node = self._getElement(json.id);

            if (changes.attributes) {
                changes.attributes.forEach(function (attribute) {
                    if (!attribute[1] || !attribute[1].length || self.options.renderingAttributeBlacklist.indexOf(attribute[0]) !== -1) {
                        node.removeAttribute(attribute[0]);
                    } else {
                        node.setAttribute(attribute[0], attribute[1]);
                    }
                });
            }

            if (options.showIDs && node.tagName) {
                node.setAttribute('archID', json.id);
            }
        }

        if (('nodeValue' in changes) && json.nodeValue !== node.textContent) {
            node.textContent = changes.nodeValue || json.nodeValue;
        }

        if (changes.childNodes) {
            self._childLink(changes.childNodes, node.childNodes);

            // sort nodes and add new nodes
            changes.childNodes.forEach(function (id, index) {
                self._getElement(+id, node.childNodes[index]);
            });

            self._removeFreeElement(node.childNodes);
        }

        return node;
    }
    _removeFreeElement (childNodes) {
        var self = this;
        [].slice.call(childNodes).forEach(function (el) {
            if (!self.getID(el)) {
                el.parentNode.removeChild(el);
            }
        });
    }
};

var Renderer = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseRenderer'];
    }
    /**
     * Get a rendered node from its ID in the Arch.
     *
     * @param {int} id
     * @returns {Node}
     */
    getElement (id) {
        return this.dependencies.BaseRenderer.getElement(id);
    }
    /**
     * Get the ID in the Arch of a rendered Node.
     *
     * @param {Node} element
     */
    getID (element) {
        return this.dependencies.BaseRenderer.getID(element);
    }
    markAsDirty (id, options) {
        this.dependencies.BaseRenderer.markAsDirty(id, options);
    }
    /**
     * Render the changes.
     *
     * @param {Object} [options]
     * @param {Boolean} [options.showIDs]
     */
    redraw (options) {
        return this.dependencies.BaseRenderer.redraw(options);
    }
};

we3.pluginsRegistry.BaseRenderer = BaseRenderer;
we3.pluginsRegistry.Renderer = Renderer;

})();
