(function () {
'use strict';

class Arch extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseArch'];
    }
    on () {
        var BaseArch = this.dependencies.BaseArch;
        BaseArch.on.apply(BaseArch, arguments);
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
        return this.dependencies.BaseArch.bypassUpdateConstraints(callback);
    }
    /**
     * Apply a function call without triggerUp change (keep constraints).
     *
     * @param {Function} callback
     * @returns {any}
     */
    bypassChangeTrigger (callback) {
        return this.dependencies.BaseArch.bypassChangeTrigger(callback);
    }
    /**
     * @param {object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @param {boolean} [options.showIDs] true to show the arch node id's
     * @returns {string}
     **/
    getValue (options) {
        return this.dependencies.BaseArch.getEditorValue(options);
    }
    /**
     * @param {string|number|ArchNode|JSON} DOM
     * @returns {ArchNode}
     **/
    parse (DOM) {
        return this.dependencies.BaseArch.parse(DOM);
    }
    setValue (value, id) {
        return this.dependencies.BaseArch.setValue(value, id);
    }
    async do (fn, options) {
        return this.dependencies.BaseArch.do(fn, options);
    }

    //--------------------------------------------------------------------------
    // Public GETTER
    //--------------------------------------------------------------------------

    /**
     * Find the first archNode that matches the given predicate function.
     *
     * @param {string|function(ArchNode)} fn
     * @returns {ArchNode|undefined}
     */
    find (fn) {
        return this.dependencies.BaseArch.getClonedArchNode(1).nextUntil(function (a) {
            return a.id !== 1 && (typeof fn === 'string' ? a[fn] && a[fn].call(a, a) : fn.call(a, a));
        });
    }
    /**
     * Find all archNodes that matches the given predicate function.
     *
     * @param {string|function(ArchNode)} fn
     * @returns {ArchNode[]}
     */
    findAll (fn) {
        var archNodes = [];
        this.dependencies.BaseArch.getClonedArchNode(1).nextUntil(function (a) {
            if(a.id !== 1 && (typeof fn === 'string' ? a[fn] && a[fn].call(a, a) : fn.call(a, a))) {
                archNodes.push(a);
            }
        });
        return archNodes;
    }
    /**
     * Get a clone of an ArchNode from its ID or its corresponding node in the DOM.
     *
     * @param {Number|Node} idOrElement
     * @param {boolean} generateNewClone
     * @returns {ArchNode}
     */
    getClonedArchNode (idOrElement, generateNewClone) {
        return this.dependencies.BaseArch.getClonedArchNode(idOrElement, generateNewClone);
    }
    getTechnicalData (id, name) {
        return this.dependencies.BaseArch.getTechnicalData(id, name);
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
        return this.dependencies.BaseArch.toJSON(id, options);
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
        return this.dependencies.BaseArch.createArchNode(nodeName, attributes, nodeValue, type);
    }
    /**
     * Import changes and apply/render them.
     * Useful for changes made on clones (like in a plugin).
     *
     * @param {JSON} changes
     * @param {Object} range
     */
    importUpdate (changes, range) {
        return this.dependencies.BaseArch.importUpdate(changes, range);
    }
    /**
     * Indent a format node at range.
     */
    indent () {
        return this.dependencies.BaseArch.indent();
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch.
     * If no element and offset are specified, insert at range (and delete
     * selection if necessary).
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Node} [element] the node in which to insert
     * @param {Number} [offset] the offset of the node at which to insert
     */
    insert (DOM, element, offset) {
        return this.dependencies.BaseArch.insert(DOM, element, offset);
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch, after a given ArchNode.
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Number} [id] the ID of the ArchNode after which to insert
     */
    insertAfter (DOM, id) {
        return this.dependencies.BaseArch.insertAfter(DOM, id);
    }
    /**
     * Insert a node or a fragment (several nodes) in the Arch, before a given ArchNode.
     *
     * @param {string|Node|DocumentFragment} DOM the node/fragment to insert (or its nodeName/nodeValue)
     * @param {Number} [id] the ID of the ArchNode before which to insert
     */
    insertBefore (DOM, id) {
        return this.dependencies.BaseArch.insertBefore(DOM, id);
    }
    /**
     * Outdent a format node at range.
     */
    outdent () {
        return this.dependencies.BaseArch.outdent();
    }
    /**
     * Remove an element from the Arch. If no element is given, remove the focusNode.
     *
     * @param {Node|null} [element] (by default, use the range)
     **/
    remove (element) {
        return this.dependencies.BaseArch.remove(element);
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
        return this.dependencies.BaseArch.setTechnicalData(id, name, value);
    }
    /**
     * Split the start node at start offset and the end node at end offset.
     *
     * @see ArchNode.split
     * @param {object} [options]
     * @param {boolean} [options.doNotBreakBlocks]
     */
    splitRange (options) {
        return this.dependencies.BaseArch.splitRange(options);
    }
    /**
     * Split the start node at start offset and the end node at end offset.
     * Keep splitting the parents until the given ancestor was split.
     * If the ancestor cannot be found, just split once.
     *
     * @see ArchNode.splitUntil
     * @param {ArchNode|function} ancestor
     * @param {object} [options]
     * @param {boolean} [options.doNotBreakBlocks]
     */
    splitRangeUntil (ancestor, options) {
        return this.dependencies.BaseArch.splitRangeUntil(ancestor, options);
    }
    /**
     * Unwrap the node(s) corresponding to the given ID(s)
     * from its (their) parent.
     *
     * @param {Number|Number []} id
     */
    unwrap (id) {
        return this.dependencies.BaseArch.unwrap(id);
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
        return this.dependencies.BaseArch.unwrapFrom(id, wrapperName);
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
        return this.dependencies.BaseArch.unwrapRangeFrom(wrapperName, options);
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
        return this.dependencies.BaseArch.wrap(id, wrapperName, options);
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
        return this.dependencies.BaseArch.wrapRange(wrapperName, options);
    }
};

we3.pluginsRegistry.Arch = Arch;

})();
