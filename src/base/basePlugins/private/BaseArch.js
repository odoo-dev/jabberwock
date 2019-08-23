(function () {
'use strict';

// what are the key problem that BaseArch is trying to solve?

/*
replace the dom with a more ligthway architecture
- optimize the rerendering

- use the normalized event
- use the rules
*/

var customArchNodes = we3.customArchNodes;
var FragmentNode = we3.ArchNodeFragment;
var ArchNode = we3.ArchNode;
var RootNode = we3.ArchNodeRoot;
var ArchNodeText = we3.ArchNodeText;
var VirtualText = we3.ArchNodeVirtualText;
var tags = we3.tags;
var reEscaped = /(&[a-z0-9]+;)/gi;
var technicalSpan = document.createElement('span');

var BaseArch = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseRules', 'BaseRenderer', 'BaseRange'];
    }
    /**
     * @param {null} value
     * @param {object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @param {boolean} [options.showIDs] true to show the arch node id's
     * @returns {string}
     **/
    getEditorValue (options) {
        return this._arch.toString(options || {}).trim();
    }
    setEditorValue (value) {
        this.setValue(value);
        return this._arch.toString({});
    }
    willStart () {
        var self = this;
        var promise = super.willStart();
        var Rules = this.dependencies.BaseRules;

        this._changes = [];
        this._arch = new RootNode({
            options: this.options,
            applyRules: Rules.applyRules.bind(Rules),
            isVoidoid: Rules.isVoidoid.bind(Rules),
            isEditableNode: Rules.isEditableNode.bind(Rules),
            isUnbreakableNode: Rules.isUnbreakableNode.bind(Rules),
            bypassUpdateConstraints: this.bypassUpdateConstraints.bind(this),
            isBypassUpdateConstraintsActive: function () {
                return self._bypassUpdateConstraintsActive;
            },
            add: this._addToArch.bind(this),
            create: function (nodeName, attributes, nodeValue, type) {
                return self._importJSON({
                    nodeName: nodeName,
                    attributes: attributes,
                    nodeValue: nodeValue,
                    type: type,
                });
            },
            change: this._changeArch.bind(this),
            remove: this._removeFromArch.bind(this),
            import: this._importJSON.bind(this),
            getClonedArchNode: this.getClonedArchNode.bind(this),
        });
        this._reset();

        return promise;
    }
    start () {
        this.dependencies.BaseRange.on('focus', this, this._onFocusNode);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Apply a function call without update constraints.
     * This explicitly allows the breaking of unbreakables
     * and the edition of not-editables. Use with care.
     *
     * @param {Function} callback
     * @returns {any}
     */
    bypassUpdateConstraints (callback) {
        var bypass = this._bypassUpdateConstraintsActive;
        this._bypassUpdateConstraintsActive = true;
        var res = callback();
        this._bypassUpdateConstraintsActive = bypass;
        return res;
    }
    /**
     * Apply a function call without triggers (keep constraints).
     *
     * @param {Function} callback
     * @returns {any}
     */
    bypassChangeTrigger (callback) {
        this._bypassChangeTriggerActive = true;
        var res = callback();
        this._bypassChangeTriggerActive = false;
        return res;
    }
    /**
     * This method receives a function (which can return a promise), the operations performed
     * in this function as a transaction. At the end of the transaction, the rules are applied,
     * the dom is updated and the triggers are made.
     *
     * @param {Function(getArchNode)} callback
     *      The function can return a range if want to apply it instead of the
     *      default range (apply on the first changed node)
     * @param {object} [options]
     * @param {boolean} [options.removeAllVirtualText] true to remove all virtual text before rendering
     * @param {boolean} [options.applyRulesForPublicMethod] true to apply rules when call a public Arch method.
     */
    async do (callback, options) {
        var self = this;
        options = options || {};
        this._resetChange();
        var _isDoTransaction = this._isDoTransaction;
        this._isDoTransaction = options;
        this._changesInTransaction = [];
        var getArchNode = function (id) {
            if (!self._isDoTransaction) {
                throw new Error("It is forbidden to take this function into your plugin.\n You're trying to move to the dark side!");
            }
            return self.getArchNode(id);
        }
        var range = await callback(getArchNode);
        this._isDoTransaction = _isDoTransaction;
        if (options.removeAllVirtualText) {
            this._removeAllVirtualText();
        }
        this._applyRulesRangeRedrawFromChanges(range);
    }
    /**
     * @param {string|number|ArchNode|JSON} DOM
     * @returns {ArchNode}
     **/
    parse (DOM) {
        var self = this;
        var fragment;
        if (typeof DOM === 'string') {
            fragment = this._parse(DOM);
        } else if (typeof DOM === 'number') {
            var archNode = this.getArchNode(DOM);
            if (archNode !== this._arch && !archNode.isFragment()) {
                fragment = new FragmentNode(this._arch.params);
                fragment.append(archNode);
            } else {
                fragment = archNode;
            }
        } else if (DOM instanceof ArchNode) {
            var archNode = DOM.isClone() ? this._importJSON(DOM.toJSON({keepVirtual: true})) : DOM;
            fragment = new FragmentNode(this._arch.params);
            fragment.append(archNode);
        } else if (DOM.ATTRIBUTE_NODE && DOM.DOCUMENT_NODE) {
            fragment = new FragmentNode(this._arch.params);
            if (DOM.nodeType !== DOM.DOCUMENT_FRAGMENT_NODE) {
                var dom = document.createDocumentFragment();
                dom.append(DOM);
                DOM = dom;
            }
            DOM.childNodes.forEach(function (node) {
                fragment.append(self._parseElement(node));
            });
        } else {
            var archNode = this._importJSON(DOM);
            if (archNode.isFragment()) {
                fragment = archNode;
            } else {
                fragment = new FragmentNode(this._arch.params);
                fragment.append(archNode);
            }
        }
        return fragment;
    }

    //--------------------------------------------------------------------------
    // Public GETTER
    //--------------------------------------------------------------------------

    /**
     * Get an ArchNode from its ID or its corresponding node in the DOM.
     *
     * @param {Number|Node} idOrElement
     * @returns {ArchNode}
     */
    getArchNode (idOrElement) {
        var archNodeId = typeof idOrElement === 'number' ? idOrElement : this.dependencies.BaseRenderer.getID(idOrElement);
        return this._archNodeList[archNodeId];
    }
    /**
     * Get a clone of an ArchNode from its ID or its corresponding node in the DOM.
     *
     * @param {Number|Node} idOrElement
     * @param {boolean} generateNewClone
     * @returns {ArchNode}
     */
    getClonedArchNode (idOrElement, generateNewClone) {
        if (generateNewClone) {
            this._cloneArchNodeList = {};
        }
        var archNodeId = typeof idOrElement === 'number' ? idOrElement : this.dependencies.BaseRenderer.getID(idOrElement);
        if (!this._cloneArchNodeList[archNodeId]) {
            this._cloneArchNodeList[archNodeId] = this._archNodeList[archNodeId] && this._archNodeList[archNodeId].clone();
        }
        return this._cloneArchNodeList[archNodeId];
    }
    /**
     * Get a technical data on an ArchNode.
     *
     * @param {integer} id
     * @param {string} name
     */
    getTechnicalData (id, name, value) {
        var archNode = this.getArchNode(id);
        return archNode && archNode._technicalData && archNode._technicalData[name];
    }
    /**
     * Get a JSON representation of the ArchNode corresponding to the given ID
     * or of the whole Arch if no ID was given.
     *
     * @param {Int} [id]
     * @param {Object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @returns {JSON}
     **/
    toJSON (id, options) {
        var archNode;
        if (typeof id === 'object') {
            options = id;
            id = null;
        }
        if (id) {
            archNode = this.getArchNode(id);
        } else {
            archNode = this._arch;
        }
        var value = archNode ? archNode.toJSON(options) : {};
        return value;
    }

    //--------------------------------------------------------------------------
    // Public SETTER
    //--------------------------------------------------------------------------

    /**
     * Create an ArchNode. If no argument is passed, create a VirtualText.
     *
     * @param {String} [nodeName]
     * @param {Object []} [attributes]
     * @param {String} [nodeValue]
     * @param {String} [type]
     * @returns {ArchNode}
     */
    createArchNode (nodeName, attributes, nodeValue, type) {
        var Constructor;
        if (type) {
            Constructor = customArchNodes[type];
        } else if (nodeName) {
            Constructor = customArchNodes[nodeName] || ArchNode;
        } else if (typeof nodeValue === 'string') {
            Constructor = ArchNodeText;
        } else {
            Constructor = VirtualText;
        }
        return new Constructor(this._arch.params, nodeName, nodeName ? attributes || [] : null, nodeValue);
    }
    // nby review: why doing a function for that?
    nextChangeIsRange () {
        this._nextChangeIsRange = true;
    }
    /**
     * Import changes and apply/render them.
     * Useful for changes made on clones (like in a plugin).
     *
     * @param {JSON} changes
     * @param {Object} range
     */
    importUpdate (changes, range) {
        var self = this;

        range = range && Object.assign({}, range);

        if (changes && !Array.isArray(changes)) {
            changes = [changes];
        }
        if (!changes.length && range) {
            this.dependencies.BaseRange.setRange(range);
            return;
        }

        var nodes = {};
        this._resetChange();

        console.warn('todo: generate a diff, from changes or json import => make changes');

        changes.forEach(function (change) {
            var archNode = self.getArchNode(change.id);
            if (archNode) {
                if (change.attributes) {
                    if (!Array.isArray(change.attributes)) {
                        change.attributes = change.attributes.toJSON();
                    }
                    archNode.attributes.forEach(function (attributeName) {
                        for (var k = 0, len = change.attributes.length; k < len; k++) {
                            if (change.attributes[k][0] === attributeName) {
                                return;
                            }
                        }
                        change.attributes.push([attributeName, null]);
                    });
                    change.attributes.forEach(function (attribute) {
                        archNode.attributes.add(attribute[0], attribute[1]);
                    });
                }
                if ('nodeValue' in change) {
                    archNode.nodeValue = change.nodeValue;
                }
                if (change.childNodes) {
                    change.childNodes.forEach(function (id) {
                        if (typeof id === 'object' && id.id && self.getArchNode(id.id) || nodes[id.id]) {
                            id = id.id;
                        }
                        nodes[id] = self.getArchNode(id) || nodes[id];
                    });
                }
            } else {
                archNode = self._importJSON(change);
            }
            nodes[archNode.id] = archNode;
            self._changeArch(archNode, 0);
        });

        changes.forEach(function (change) {
            if (!change.childNodes) {
                return;
            }
            var archNode = self.getArchNode(change.id);
            archNode.empty();
            change.childNodes.forEach(function (id) {
                if (typeof id === 'number' && nodes[id]) {
                    archNode.append(nodes[id]);
                } else if (typeof id === 'object') {
                    archNode.append(self._importJSON(id));
                } else {
                    throw new Error('Imported node "' + id + '" is missing');
                }
            });
        });

        this._applyRulesRangeRedrawFromChanges(range);
    }
    /**
     * Indent a format node at range.
     */
    indent () {
        this._indent(false);
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch.
     * If no element and offset are specified, insert at range (and delete
     * selection if necessary).
     *
     * FIXME the doc is wrong...
     * FIXME trying to insert a node at its current location make it go away...
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Node} [element] the node in which to insert
     * @param {Number} [offset] the offset of the node at which to insert
     */
    insert (DOM, element, offset) {
        this._resetChange();
        if (typeof DOM !== 'string' && this.dependencies.BaseRenderer.getID(DOM)) {
            DOM = this.dependencies.BaseRenderer.getID(DOM);
        }
        var id = typeof element === 'number' ? element : element && this.dependencies.BaseRenderer.getID(element);
        if (!id) {
            var range = this.dependencies.BaseRange.getRange();
            if (range.isCollapsed()) {
                id = range.scID;
                offset = range.so;
            } else {
                id = this.removeFromRange({
                    doNotRemoveEmpty: true,
                }).id;
                offset = 0;
            }
        }
        var index = this._changes.length;
        var insertedIDs = this._insert(DOM, id, offset);
        if (this._changes.length > index) {
            if (insertedIDs.length > 1) {
                this._changes[this._changes.length - 1].isRange = true;
            } else {
                this._changes[index].isRange = true;
            }
        }
        this._applyRulesRangeRedrawFromChanges();
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch, after a given ArchNode.
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Number} [id] the ID of the ArchNode after which to insert
     */
    insertAfter (DOM, id) {
        var archNode = this.getArchNode(id);
        this.insert(DOM, archNode.parent.id, archNode.index() + 1);
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch, before a given ArchNode.
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Number} [id] the ID of the ArchNode before which to insert
     */
    insertBefore (DOM, id) {
        var archNode = this.getArchNode(id);
        this.insert(DOM, archNode.parent.id, archNode.index());
    }
    /**
     * Outdent a format node at range.
     */
    outdent () {
        this._indent(true);
    }
    /**
     * Remove an element from the Arch. If no element is given, remove the focusNode.
     *
     * @param {Node|null} [element] (by default, use the range)
     **/
    remove (element) {
        this._resetChange();
        var id = typeof element === 'number' ? element : element && this.dependencies.BaseRenderer.getID(element);
        if (id) {
            this.getArchNode(id).remove();
        } else {
            this.removeFromRange();
        }
        this._applyRulesRangeRedrawFromChanges();
    }
    /**
     * Delete everything between the start and end points of the range.
     *
     * @private
     * @param {Object} [options]
     * @param {Object} [options.doNotRemoveEmpty] true to prevent the removal of empty nodes
     * @returns {VirtualText} the VirtualText node inserted at the beginning of the range
     */
    removeFromRange (options) {
        var range = this.dependencies.BaseRange.getRange();
        if (range.isCollapsed()) {
            return;
        }

        options = options || {};
        var virtualTextNodeBegin = this.createArchNode(); // the next range
        var virtualTextNodeEnd = this.createArchNode();

        var endNode = this.getArchNode(range.ecID);
        var fromNode = this.getArchNode(range.scID);
        var commonAncestor = endNode.commonAncestor(fromNode);
        endNode.insert(virtualTextNodeEnd, range.eo);

        if (!endNode.__removed && commonAncestor.id !== endNode.parent.id &&
                fromNode.parent.id !== endNode.parent.id) {
            endNode.splitUntil(commonAncestor, endNode.length());
        }

        fromNode = this.getArchNode(range.scID);
        fromNode.insert(virtualTextNodeBegin, range.so);

        var toRemove = [];
        virtualTextNodeBegin.nextUntil(function (next) {
            if (next === virtualTextNodeEnd) {
                return true;
            }
            if (next.parent && !next.isAllowUpdate() && next.parent.isAllowUpdate()) {
                toRemove.push(next);
                return false;
            }
            if (next.isAllowUpdate() && (!next.childNodes || !next.childNodes.length)) {
                toRemove.push(next);
            }
            return false;
        });

        toRemove.forEach(function (archNode) {
            var parent = archNode.parent;
            archNode.remove();
            while (parent && parent.isEmpty() && !parent.contains(virtualTextNodeBegin) &&
                (!parent.parent || parent.parent.isAllowUpdate())) {
                var newParent = parent.parent;
                parent.remove();
                parent = newParent;
            }
        });

        options.keepRight = true;
        if (range.ecID !== range.scID && virtualTextNodeBegin.parent.id !== commonAncestor.id) {
            virtualTextNodeBegin.parent.deleteEdge(false, options);
        }

        this._removeAllVirtualText([virtualTextNodeBegin.id]);

        return virtualTextNodeBegin;
    }
    /**
     * Set a technical data on an ArchNode. The technical data are never
     * redered or exported.
     *
     * @param {integer} id
     * @param {string} name
     * @param {any} value
     */
    setTechnicalData (id, name, value) {
        var archNode = this.getArchNode(id);
        if (!archNode._technicalData) {
            archNode._technicalData = {};
        }
        archNode._technicalData[name] = value;
    }
    /**
     * Set a value on the editor or an ArchNode. The value is parsed and
     * automatically apply the rules.
     *
     * @param {any} value
     * @param {integer} [id]
     */
    setValue (value, id) {
        var self = this;
        return this.bypassUpdateConstraints(function () {
            self._reset(value || '', id);
        });
    }
    /**
     * Split the start node at start offset and the end node at end offset.
     *
     * @see ArchNode.split
     * @param {object} [options]
     * @param {boolean} [options.doNotBreakBlocks]
     */
    splitRange (options) {
        options = options || {};
        var range = this.dependencies.BaseRange.getRange();
        var scArch = this.getArchNode(range.scID);
        var ecArch = this.getArchNode(range.ecID);
        var afterEnd = options.doNotBreakBlocks && ecArch.isBlock() ? null : ecArch.split(range.eo);
        var start = options.doNotBreakBlocks && scArch.isBlock() ? scArch : scArch.split(range.so);
        var end = afterEnd && afterEnd.prev() || ecArch;
        this._applyRulesRangeRedrawFromChanges({
            scID: start && start.id || scArch.id,
            so: 0,
            ecID: end.id,
            eo: end.length(),
        });
    }
    /**
     * Split the start node at start offset and the end node at end offset.
     * Keep splitting the parents until the given ancestor was split.
     * If the ancestor cannot be found, just split once.
     * Return the ArchNode on the right hand side of the split.
     *
     * @see ArchNode.splitUntil
     * @param {ArchNode|function} ancestor
     * @param {object} [options]
     * @param {boolean} [options.doNotBreakBlocks]
     * @returns {ArchNode}
     */
    splitRangeUntil (ancestor, options) {
        options = options || {};
        var range = this.dependencies.BaseRange.getRange();
        var __hasMatch = node => typeof ancestor !== 'function' || node.ancestor(ancestor);
        var ecArch = this.getArchNode(range.ecID);
        var end = __hasMatch(ecArch) ? ecArch.splitUntil(ancestor, range.eo) : ecArch.split(range.eo).prev();
        var scArch = this.getArchNode(range.scID);
        var start = __hasMatch(scArch) ? scArch.splitUntil(ancestor, range.so) || scArch : scArch.split(range.so);
        this._applyRulesRangeRedrawFromChanges({
            scID: start.id,
            so: 0,
            ecID: end.id,
            eo: end.length(),
        });
    }
    /**
     * Unwrap the node(s) corresponding to the given ID(s)
     * from its (their) parent.
     *
     * @param {Number|Number []} id
     */
    unwrap (id) {
        var self = this;
        this._resetChange();
        var ids = Array.isArray(id) ? id : [id];
        // unwrap
        ids.forEach(function (id) {
            self.getArchNode(id).unwrap();
        });
        // render and select all unwrapped
        var range = ids.length ? this.dependencies.BaseRange.rangeOn(ids[0], ids[ids.length - 1]) : {};
        this._applyRulesRangeRedrawFromChanges(range);
    }
    /**
     * Unwrap the node(s) corresponding to the given ID(s)
     * from its (their) first ancestor with the given
     * nodeName(s) (`wrapperName`).
     *
     * @param {Number|Number []} id
     * @param {string|string []} wrapperName
     */
    unwrapFrom (id, wrapperName) {
        var ids = Array.isArray(id) ? id : [id];
        var wrapperNames = Array.isArray(wrapperName) ? wrapperName : [wrapperName];
        var toUnwrap = this._getNodesToUnwrap(ids, wrapperNames);
        toUnwrap.forEach(function (unwrapInfo) {
            if (!unwrapInfo.node || !unwrapInfo.node.isInArch()) {
                return;
            }
            /* Split to isolate the node to unwrap (that is, the node
            whose parent needs to go) */
            var ancestorToUnwrap = unwrapInfo.node.ancestor(function (a) {
                a.splitAround();
                return a.parent.nodeName === unwrapInfo.wrapperName;
            });
            if (ancestorToUnwrap) {
                ancestorToUnwrap.unwrap();
            }
        });
        var unwrapped = we3.utils.uniq(
            toUnwrap.map(unwrapInfo => unwrapInfo.node)
                .filter(node => node && node.isInArch())
        );
        unwrapped = we3.utils.uniq(unwrapped);
        var range;
        if (unwrapped.length) {
            var scArch = unwrapped[0];
            var ecArch = unwrapped[unwrapped.length - 1];
            range = this.dependencies.BaseRange.rangeOn(scArch, ecArch);
        }
        this._applyRulesRangeRedrawFromChanges(range);
    }
    /**
     * Unwrap every node in range from their first ancestor
     * with the given nodeName(s) (`wrapperName`).
     * If the range is collapsed, insert a virtual text node and unwrap it.
     * This effectively creates a focusable zone that is not wrapped by the ancestor.
     * Eg: `<p><b>te◆xt</b></p> => <p><b>te</b>◆<b>xt</b></p>`
     *
     * @param {string|string []} wrapperName
     * @param {object} [options]
     * @param {boolean} [options.doNotSplit] true to unwrap the full nodes without splitting them
     */
    unwrapRangeFrom (wrapperName, options) {
        options = options || {};
        var range = this.dependencies.BaseRange.getRange();
        var start, end;
        var scArch = this.getArchNode(range.scID)
        if (range.isCollapsed()) {
            start = end = this.createArchNode();
            scArch.insert(start, range.so);
        } else {
            var ecArch = this.getArchNode(range.ecID);
            end = options.doNotSplit ? ecArch : ecArch.split(range.eo) || ecArch;
            start = options.doNotSplit ? scArch : scArch.split(range.so) || scArch;
        }
        var selectedNodes = start.getNodesUntil(end, {
            includeStart: true,
            includeEnd: !!options.doNotSplit,
        });
        this.unwrapFrom(selectedNodes, wrapperName);
    }
    /**
     * Wrap the node(s) corresponding to the given ID(s) inside
     * (a) new ArchNode(s) with the given nodeName.
     * If no ID is passed or `id` is an empty Array, insert a virtual
     * at range and wrap it.
     *
     * @param {Number|Number []} [id]
     * @param {String} wrapperName
     * @param {object} [options]
     * @param {boolean} [options.asOne] true to wrap the nodes together as one instead of individually
     * @returns {number []} ids of the genereated wrappers
     */
    wrap (id, wrapperName, options) {
        this._resetChange();
        return this._wrap(id, wrapperName, options || {});
    }
    /**
     * Wrap every node in range into a new node with the given nodeName (`wrapperName`).
     * If the range is collapsed, insert a virtual text node and wrap it.
     * This effectively creates a focusable zone that is wrapped.
     * Eg: `<p>te◆xt</p> => <p>te<b>◆</b>xt</p>`
     *
     * @param {string} wrapperName
     * @param {object} [options]
     * @param {function} [options.wrapAncestorPred] if specified, wrap the selected node's first ancestors that match the predicate
     * @param {boolean} [options.doNotSplit] true to wrap the full nodes without splitting them
     * @param {boolean} [options.asOne] true to wrap the nodes together as one instead of individually
     * @returns {number []} ids of the genereated wrappers
     */
    wrapRange (wrapperName, options) {
        this._resetChange();
        options = options || {};
        var range = this.dependencies.BaseRange.getRange();
        var ecArch = this.getArchNode(range.ecID);
        var end = options.doNotSplit ? ecArch : ecArch.split(range.eo) || ecArch;
        var scArch = this.getArchNode(range.scID)
        var start = options.doNotSplit ? scArch : scArch.split(range.so) || scArch;

        var toWrap = start.getNodesUntil(end, {
            includeStart: true,
            includeEnd: !!options.doNotSplit,
        }).map(id => this.getArchNode(id));
        if (options.wrapAncestorPred) {
            toWrap = toWrap.map(node => node.ancestor(ancestor => options.wrapAncestorPred(ancestor)))
                           .filter(node => node && node.isInArch());
            toWrap = we3.utils.uniq(toWrap);
        }
        if (!toWrap.length) {
            var virtual = this.createArchNode();
            scArch.insert(start, range.so);
            toWrap = [virtual];
        }
        return this._wrap(toWrap.map(node => node.id), wrapperName, options);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Give the given ArchNode an ID and a parent and add it to the Arch.
     *
     * @private
     * @param {ArchNode} archNode
     */
    _addToArch (archNode) {
        var isInArch = archNode.parent && archNode.parent.id &&
            !archNode.parent.isClone() && archNode.isInRoot();
        if (isInArch) {
            var archNodeList = this._archNodeList;
            var toAdd = [archNode];
            while (archNode = toAdd.pop()) {
                archNode.__removed = false;
                archNode.id = archNode.id || ++this._id;
                archNodeList[archNode.id] = archNode;
                if (archNode.childNodes) {
                    for (var k = 0, len = archNode.childNodes.length; k < len; k++) {
                        var child = archNode.childNodes[k];
                        toAdd.push(child);
                        this._changeArch(child, null);
                    }
                }
            }
        }
    }
    /**
     * Take the list of current changes
     * Apply the changes to the renderer and update the range
     *
     * @private
     * @param {Object} [range]
     * @param {Object} [result]
     * @returns {Object|undefined} {range: {WrappedRange}, focus: {ArchNode}}
     */
    _applyChangesOnRendererAndRerange (range, result) {
        var BaseRenderer = this.dependencies.BaseRenderer;
        var BaseRange = this.dependencies.BaseRange;

        var rangeRes;
        if (range) {
            rangeRes = BaseRange.setRange(range, {
                muteDOMRange: true,
                muteTrigger: true,
            });
        } else {
            range = result.range;
            rangeRes = BaseRange.setRange({
                scID: range.id,
                so: range.offset,
            }, {
                muteDOMRange: true,
                muteTrigger: true,
            });
            delete result.range;
        }

        this._changes = [];
        this._cleanUnnecessaryVirtuals();
        if (this._changes.length) {
            var processedChanges = this._processChanges(this._changes);
            result.json = result.json.concat(processedChanges.json);
        }

        BaseRenderer.update(result.json);
        rangeRes = BaseRange.restore();

        return rangeRes;
    }
    /**
     * Get the current changes after application of the rules and filtering
     * out the nodes that are not in the Arch anymore.
     * Deduce the range from the changes and return an object with the changes
     * and the range.
     *
     * @private
     * @return {Object} {changes: {JSON []}, json: {Object []}, removed: {Object}, range: {Object}}
     */
    _applyRulesAndGetChanges () {
        var changedArchNodes = this._changes.map(change => change.archNode);
        this.dependencies.BaseRules.applyRules(changedArchNodes);
        var changesToProcess = this._changesInTransaction.concat(this._changes);
        return this._processChanges(changesToProcess);
    }
    /**
     * Take the list of current changes
     * Apply the rules and render them, except if it's temporary changes (do)
     * If a range is passed, set it, otherwise deduce it from the changes.
     *
     * @private
     * @param {Object} [range]
     */
    _applyRulesRangeRedrawFromChanges (range) {
        if (this._isDoTransaction) {
            if (this._changes.length && this._isDoTransaction.applyRulesForPublicMethod) {
                this._applyRulesAndRangeForTemporaryChanges(range);
            }
        } else {
            var result = this._applyRulesAndGetChanges();
            if (result.changes.length) {
                this._cloneArchNodeList = {};
                var rangeRes = this._applyChangesOnRendererAndRerange(range, result);
                this._triggerUpdates(result, rangeRes);
            }
        }
    }
    /**
     * Take the list of temporary current changes.
     * If a range is passed, set it, otherwise deduce it from the changes.
     *
     * @private
     */
    _applyRulesAndRangeForTemporaryChanges () {
        var self = this;
        var range;

        this.dependencies.BaseRules.applyRules(this._changes.map(function (c) {return c.archNode}));

        this._changes.forEach(function (c, i) {
            var id = c.archNode.id || c.id;
            if ((!range || c.isRange) && id && self.getArchNode(id)) {
                range = {
                    scID: id,
                    so: c.offset,
                };
            }
        });
        this.dependencies.BaseRange.setRange(range, {
            muteDOMRange: true,
            muteTrigger: true,
        });
    }
    /**
     * Add the given ArchNode and offset to the list of changes
     * and notify the Rules plugin.
     *
     * @private
     * @param {ArchNode} archNode
     * @param {Number} offset
     */
    _changeArch (archNode, offset) {
        this.dependencies.BaseRules.changeArchTriggered(archNode, offset);
        if (archNode.isClone()) {
            return;
        }
        this._changes.push({
            id: archNode.id,
            archNode: archNode,
            offset: offset,
            isRange: this._nextChangeIsRange,
        });
        this._nextChangeIsRange = false;
    }
    /**
     * Before rendering, remove all unnecessary virtual nodes. At most one
     * virtual node should stay at a time. The virtual can stay iff:
     * - if the range is on the virtual
     * - AND the virtual is not next to a text node
     */
    _cleanUnnecessaryVirtuals () {
        var BaseRange = this.dependencies.BaseRange;
        var range = BaseRange.getRange();
        if (!range.scArch.isVirtual() && !range.ecArch.isVirtual()) {
            return this._removeAllVirtualText(); // remove if not on range
        }

        var virtuals = this._arch.descendents('isVirtual', true);
        virtuals.slice().forEach(function (virtual) {
            var isSc = range.scID === virtual.id;
            var isEc = range.ecID === virtual.id;
            if (!isSc && !isEc) {
                return virtual.remove(); // remove if not on range
            }

            var prev = virtual.previousSibling();
            var isPrevText = prev && prev.isText();
            var next = virtual.nextSibling();
            var isNextText = next && next.isText();
            if (isPrevText || isNextText) {
                var textNode = isPrevText ? prev : next;
                virtual.remove(); // remove if next to text (rerange on text)
                BaseRange.setRange({
                    scID: isSc ? textNode.id : range.scID,
                    so: isSc ? (isPrevText ? textNode.length() : 0) : range.so,
                    ecID: isEc ? textNode.id : range.ecID,
                    eo: isEc ? (isPrevText ? textNode.length() : 0) : range.eo,
                }, { muteDOMRange: true });
            }
        });
    }
    /**
     * Return an array of objects containing information on the nodes to unwrap,
     * given the ids of nodes to inspect and the nodeNames from which to unwrap.
     *
     * @private
     * @param {number []} ids
     * @param {string []} wrapperNames
     * @returns {object []} {node: {ArchNode} the node to unwrap
     *                       wrapperName: {string} the nodeName to unwrap it from}
     */
    _getNodesToUnwrap (ids, wrapperNames) {
        var self = this;
        var nodes = ids.map((id) => self.getArchNode(id));
        var toUnwrap = [];
        nodes.forEach(function (node) {
            var descendentsToUnwrap = [];
            node.ancestor(function (a) {
                var isToUnwrapFromParent = a.parent && wrapperNames.indexOf(a.parent.nodeName) !== -1;
                if (isToUnwrapFromParent) {
                    descendentsToUnwrap.push({
                        id: node.id,
                        wrapperName: a.parent.nodeName,
                    });
                }
            });
            /* Reverse to get the higher ancestor first. This way we ensure
            unwrapping from ancestor down to descendent (otherwise we might
            try to unwrap a node that was already removed) */
            descendentsToUnwrap.reverse();
            toUnwrap = toUnwrap.concat(descendentsToUnwrap);
        });
        // We want a single ID only once with the same wrapper name
        // but we want to return the nodes, not the IDs.
        return we3.utils.uniq(toUnwrap, {
            deepCompare: true,
        }).map(function (unwrapInfo) {
            return {
                node: self.getArchNode(unwrapInfo.id),
                wrapperName: unwrapInfo.wrapperName,
            }
        });
    }
    /**
     * Create an ArchNode and its children from a JSON representation.
     *
     * @private
     * @param {JSON} json
     * @returns {ArchNode}
     */
    _importJSON (json) {
        return this.dependencies.BaseRules.parse(this._importRecursiveJSON(json));
    }
    /**
     * Create an ArchNode and its children from a JSON representation (no parsing).
     *
     * @see _importJSON
     * @private
     * @param {JSON} json
     * @returns {ArchNode}
     */
    _importRecursiveJSON (json) {
        var self = this;
        var archNode = this.createArchNode(json.nodeName, json.attributes, json.nodeValue, json.type);
        if (json.childNodes) {
            json.childNodes.forEach(function (json) {
                archNode.append(self._importJSON(json));
            });
        }
        archNode.id = json.id;
        return archNode;
    }
    /**
     * Indent or outdent a format node.
     *
     * @private
     * @param {boolean} outdent true to outdent, false to indent
     */
    _indent (outdent) {
        var self = this;
        this._resetChange();
        var range = this.dependencies.BaseRange.getRange();
        var selectedLeaves = this.dependencies.BaseRange.getSelectedLeaves();
        var selectedLeavesIDs = we3.utils.uniq(selectedLeaves.map(clone => clone.id));
        selectedLeavesIDs.forEach(function (id) {
            var archNode = self.getArchNode(id);
            if (!archNode.isAllowUpdate()) {
                return;
            }
            var offset = range.scID === archNode.id ? range.so : 0;
            archNode._triggerChange(offset);
            var formatAncestor = archNode.ancestor('isFormatNode');
            if (outdent && formatAncestor && formatAncestor.isIndented() && !formatAncestor.isLi() || !archNode.isInList()) {
                self._indentText(archNode, outdent);
            } else {
                self[outdent ? '_outdentList' : '_indentList'](archNode);
            }
        });
        this._applyRulesRangeRedrawFromChanges();
    }
    /**
     * Indent a list element.
     *
     * @private
     * @param {ArchNode} archNode
     */
    _indentList (archNode) {
        archNode.ancestor('isLi').indent();
    }
    /**
     * Indent a text.
     *
     * @see options.indentMargin
     * @private
     * @param {ArchNode} archNode
     * @param {boolean} outdent true to outdent, false to indent
     */
    _indentText (archNode, outdent) {
        var block = archNode.ancestor('isBlock');
        var currentMargin = block.attributes.style['margin-left'];
        var currentFloat = currentMargin ? parseFloat(currentMargin.match(/[\d\.]*/) || 0) : 0;
        var newMargin = outdent ? currentFloat - this.options.indentMargin : currentFloat + this.options.indentMargin;
        if (newMargin <= 0) {
            block.attributes.style.remove('margin-left');
        } else {
            block.attributes.style.add('margin-left', newMargin + 'em');
        }
    }
    /**
     * Insert a node in the Arch, within the node corresponding to the given id,
     * at its given offset if any, or at the root if none.
     *
     * @private
     * @param {string|Node|DocumentFragment} DOM
     * @param {Number} [id]
     * @param {Number} [offset]
     * @returns {Number []} the ids of the inserted nodes
     */
    _insert (DOM, id, offset) {
        var targetArchNode = id ? this.getArchNode(id) : this._arch;
        if (!targetArchNode) {
            console.warn('The node ' + id + ' is no longer in the ach.');
            targetArchNode = this._arch;
            offset = 0;
        }

        var nextChangeIsRange = this._nextChangeIsRange;
        var changes = this._changes.slice();
        var fragment = this.parse(DOM);
        this._changes = changes;
        if (nextChangeIsRange) {
            this.nextChangeIsRange();
        }

        offset = offset || 0;
        var insertedNodes = targetArchNode.insert(fragment, offset);
        return insertedNodes.map(node => node.id);
    }
    /**
     * Outdent a list element.
     *
     * @private
     * @param {ArchNode} archNode
     */
    _outdentList (archNode) {
        archNode.ancestor('isLi').outdent();
    }
    /**
     * Parse HTML/XML and build the Arch from it.
     *
     * @private
     * @param {string} html
     * @returns {FragmentNode}
     **/
    _parse (html) {
        var self = this;
        var fragment = new FragmentNode(this._arch.params);

        var reTags = '(' + tags.void.join('|') + ')';
        var reAttribute = '(\\s[^>/]+((=\'[^\']*\')|(=\"[^\"]*\"))?)*';
        var reVoidNodes = new RegExp('<(' + reTags + reAttribute + ')>', 'g');
        var xml = html.replace(reVoidNodes, '<\$1/>').replace(/&/g, '&amp;');
        var parser = new DOMParser();
        var element = parser.parseFromString("<root>" + xml + "</root>","text/xml");

        var root;
        if (element.querySelector('parsererror')) {
            console.error(element.firstChild);
            console.warn('XML parsing fail, fallback on HTML parsing');
            root = document.createElement('root');
            root.innerHTML = xml;
        } else {
            root = element.querySelector('root');
        }

        root.childNodes.forEach(function (element) {
            fragment.append(self._parseElement(element));
        });

        return fragment;
    }
    /**
     * Parse a node to make an ArchNode from it.
     *
     * @private
     * @param {Node} element
     * @returns {ArchNode}
     */
    _parseElement (element) {
        var self = this;
        var archNode;
        if (element.tagName) {
            var attributes = Object.values(element.attributes).map(function (attribute) {
                return [attribute.name, attribute.value];
            });
            archNode = this._importJSON({
                nodeName: element.nodeName.toLowerCase(),
                attributes: attributes,
            });
            element.childNodes.forEach(function (child) {
                archNode.append(self._parseElement(child));
            });
        } else {
            archNode = this._importJSON({
                nodeValue: this._unescapeText(element.nodeValue),
            });
        }
        return archNode;
    }
    /**
     * Filter out the nodes that are not in the Arch anymore from a list of
     * changes. Deduce the range from the changes and return an object with the
     * changes and the range.
     *
     * @private
     * @param {Object []} changesToProcess
     * @return {Object} {changes: {JSON []}, json: {Object []}, removed: {Object}, range: {Object}}
     */
    _processChanges (changesToProcess) {
        var self = this;
        var BaseRenderer = this.dependencies.BaseRenderer;
        var range;
        var changes = [];
        var removed = {};
        changesToProcess.forEach(function (c) {
            var id = c.archNode.id || c.id;
            if (!id || !self.getArchNode(id)) {
                if (id && !removed[id]) {
                    removed[id] = {
                        id: id,
                        element: BaseRenderer.getElement(id),
                    };
                }
                return;
            }
            var toAdd = true;
            changes.forEach(function (change) {
                if (change.id === c.archNode.id || change.id && change.id === c.id) {
                    toAdd = false;
                    if (c.offset != null || change.offset == null) {
                        change.offset = c.offset;
                    }
                    if (c.isRange) {
                        range = change;
                    }
                }
            });
            if (toAdd) {
                var change = {
                    id: c.archNode.id || c.id,
                    offset: c.offset,
                };
                changes.push(change);
                if (!range || c.isRange) {
                    range = change;
                }
            }
        });

        var json = changes.map(function (change) {
            return self.getArchNode(change.id).toJSON({
                keepVirtual: true,
            });
        });

        return {
            changes: changes,
            json: json,
            removed: removed,
            range: range,
        };
    }
    /**
     * Remove all virtual text nodes from the Arch, except the optional
     * list passed in argument.
     *
     * @private
     * @param {Number []} [except] id's to ignore
     */
    _removeAllVirtualText (except) {
        var self = this;
        Object.keys(this._archNodeList).forEach(function (id) {
            id = parseInt(id);
            if (except && except.indexOf(id) !== -1) {
                return;
            }
            var archNode = self.getArchNode(id);
            if (archNode.isText() && archNode.isVirtual()) {
                archNode.remove();
            }
        });
    }
    /**
     * Remove the given ArchNode and its children from the Arch.
     *
     * @private
     * @param {ArchNode} archNode
     */
    _removeFromArch (archNode) {
        var self = this;
        if (this._archNodeList[archNode.id] && !archNode.isClone()) {
            if (this._archNodeList[archNode.id] === archNode) {
                delete this._archNodeList[archNode.id];
            }
            archNode.__removed = true;
            if (archNode.childNodes) {
                archNode.childNodes.forEach(function (archNode) {
                    self._removeFromArch(archNode);
                });
            }
        }
    }
    /**
     * Reset the Arch with the given start value if any.
     *
     * @private
     * @param {String} [value]
     * @param {ArchNode} [target]
     */
    _reset (value, id) {
        this._changes = [];

        if (!id) {
            id = 1;
            this._id = 1;
            this._arch.id = 1;
            this._archNodeList = {'1':  this._arch};
            this._arch.parent = null;
            this._arch.childNodes = [];
        } else {
            this.getArchNode(id).empty();
        }

        this._cloneArchNodeList = {};

        if (value) {
            if (typeof value === 'object' && value.id === id) {
                value.type = 'FRAGMENT';
                value.id = null;
                value.attributes = null;
            }
            this._insert(value, id, 0);
            this.dependencies.BaseRules.applyRules(this._changes.map(function (c) {return c.archNode}));
        }

        this.dependencies.BaseRenderer.reset(this._arch.toJSON({keepVirtual: true}));

        this._changes = [];
    }
    /**
     * Reset the list of changes.
     *
     * @private
     */
    _resetChange () {
        this.nextChangeIsRange();
        if (this._isDoTransaction) {
            this._changesInTransaction = this._changesInTransaction.concat(this._changes);
            this._changes = [];
        } else {
            this._changesInTransaction = this._changes = [];
        }
    }
    /**
     * Called after a transaction of changes ('do', or public Arch method)
     *
     * @private
     * @param {Object} [result]
     * @param {Object} [rangeRes]
     */
    _triggerUpdates (result, rangeRes) {
        var BaseRenderer = this.dependencies.BaseRenderer;
        var BaseRange = this.dependencies.BaseRange;

        if (!this._bypassChangeTriggerActive) {
            this.trigger('update', result.json);
        }

        if (rangeRes && rangeRes.range) {
            BaseRange.trigger('range', rangeRes.range);
        }
        if (rangeRes && rangeRes.focus) {
            BaseRange.trigger('focus', rangeRes.focus);
        }

        if (!this._bypassChangeTriggerActive) {
            this.triggerUp('change', {
                changes: result.changes.map(function (c) {
                    return {
                        id: c.id,
                        element: BaseRenderer.getElement(c.id),
                    }
                }),
                removed: Object.values(result.removed).filter(function (c) {
                    return c.element && !BaseRenderer.getID(c.element); // element can be attach to an other node
                }),
            });
        }
    }
    /**
     * Remove all escaping from a text content.
     *
     * @private
     * @param {String} text
     */
    _unescapeText (text) {
        return text.replace(reEscaped, function (a, r) {
            technicalSpan.innerHTML = r;
            return technicalSpan.textContent;
        });
    }
    /**
     * Wrap the node(s) corresponding to the given ID(s) inside
     * (a) new ArchNode(s) with the given nodeName.
     * If no ID is passed or `id` is an empty Array, insert a virtual
     * at range and wrap it.
     *
     * @param {Number|Number []} [id]
     * @param {String} wrapperName
     * @param {object} [options]
     * @param {boolean} [options.asOne] true to wrap the nodes together as one instead of individually
     * @returns {number []} ids of the genereated wrappers
     */
    _wrap (id, wrapperName, options) {
        var self = this;
        var ids = Array.isArray(id) ? id : [id];
        // wrap
        var newParents = [];
        if (options.asOne) {
            var wrapper = this.createArchNode(wrapperName);
            this.getArchNode(ids[0]).before(wrapper);
            ids.forEach(id => wrapper.append(self.getArchNode(id)));
            newParents.push(wrapper);
        } else {
            newParents = ids.map(id => self.getArchNode(id).wrap(wrapperName));
            newParents = newParents.filter(parent => parent && parent.isInArch());
        }
        // render and select every wrapped node
        var scArch = newParents[0].firstLeaf();
        var ecArch = newParents[newParents.length - 1].lastLeaf();
        var range = this.dependencies.BaseRange.rangeOn(scArch, ecArch);
        this._applyRulesRangeRedrawFromChanges(range);
        return newParents.map(node => node.id);
    }


    _onFocusNode (focusNode) {
        // get the previous focus Node's block ancestor
        var lastBlockClone = this._lastFocus && this._lastFocus.ancestor('isBlock');
        var lastBlock = lastBlockClone && this.getArchNode(lastBlockClone.id);

        if (lastBlock) {
            // find all empty format descendents
            var range = this.dependencies.BaseRange.getRange();
            var formatNodes = lastBlock.descendents(function (node) {
                return !node.isInVoidoid() && we3.tags.format.indexOf(node.nodeName) !== -1;
             }, true);
            var toRemove = formatNodes.filter(function (node) {
                return node.isEmpty() && node.isAllowUpdate() &&
                    !range.scArch.isDescendentOf(node) &&
                    !range.scArch.isDescendentOf(node);
            });

            // remove the empty format descendents and preserve range
            if (toRemove.length) {
                this.do(function () {
                    toRemove.forEach(node => node.remove());
                    return range;
                });
            }
        }
        this._lastFocus = focusNode;
    }
};

we3.pluginsRegistry.BaseArch = BaseArch;

})();
