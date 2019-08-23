(function () {
'use strict';

function True () { return true; };

var Attributes = we3.Attributes;
var Classes = [];
var ClonedClasses = [];
function getClonedClass (ClassToClone) {
    var index = Classes.indexOf(ClassToClone);
    if (index === -1) {
        var ClonedClass = class extends ClassToClone {
            constructor (params, nodeName, attributes, nodeValue, clonedArchNode) {
                if (!clonedArchNode.id) {
                    throw new Error("Should not clone an archNode out of the arch");
                }
                super(...arguments);
                this.id = clonedArchNode.id;
                this._clonedArchNode = clonedArchNode;
                this._clonedParentUnknown = true;
                this._clonedChildNodesUnknown = true;

                var self = this;
                var forbidden = Object.getOwnPropertyNames(ClonedClass.prototype);
                Object.getOwnPropertyNames(clonedArchNode).forEach(function (name) {
                    if (typeof clonedArchNode[name] === 'function' || forbidden.indexOf(name) === -1) {
                        self[name] = clonedArchNode[name];
                    }
                });
            }
            isClone () {
                return true;
            }
            get parent () {
                if (this._clonedParentUnknown) {
                    this.parent = this._clonedArchNode.parent && this.params.getClonedArchNode(this._clonedArchNode.parent.id);
                }
                return this._parent;
            }
            set parent (parent) {
                this._clonedParentUnknown = false;
                this._parent = parent;
            }
            get childNodes () {
                if (this._clonedChildNodesUnknown) {
                    var self = this;
                    this._clonedChildNodesUnknown = false;
                    this._childNodes = self._clonedArchNode.childNodes.map(function (archNode) {
                        var clone = self.params.getClonedArchNode(archNode.id);
                        clone.parent = self;
                        return clone;
                    });
                }
                return this._childNodes;
            }
            set childNodes (childNodes) {
                return this._childNodes = childNodes;
            }
            _triggerChange () {
                return;
            }
        };
        Classes.push(ClassToClone);
        ClonedClasses.push(ClonedClass);
        return ClonedClass;
    }
    return ClonedClasses[index];
}

we3.ArchNode = class {
    constructor (params, nodeName, attributes, nodeValue) {
        this.params = params;
        this.nodeName = nodeName && nodeName.toLowerCase();
        this.nodeValue = !nodeName && nodeValue;
        if (nodeName || !this.isText()) {
            this.attributes = new Attributes(this, attributes || []);
            if (!this.attributes.class) {
                this.attributes.add('class', '');
            }
            if (!this.attributes.style) {
                this.attributes.add('style', '');
            }
        }
        this.childNodes = [];
        this._triggerChange(this.length());
    }
    get className () {
        return this.attributes && this.attributes.class;
    }
    set className (className) {
        return this.attributes.add('class', className);
    }
    get style () {
        return this.attributes && this.attributes.style;
    }
    get type () {
        return 'ArchNode';
    }

    //--------------------------------------------------------------------------
    // Public: Export
    //--------------------------------------------------------------------------

    /**
     * Get a clone of the ArchNode.
     *
     * @returns {ArchNode}
     */
    clone () {
        var Constructor = getClonedClass(this.constructor);
        return new Constructor(this.params, this.nodeName, this.attributes, this.nodeValue, this);
    }
    /**
     * Get a JSON representation of the ArchNode and its children.
     *
     * @param {Object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @returns {JSON}
     **/
    toJSON (options) {
        var data = {
            type: this.type,
        };
        if (this.id) {
            data.id = this.id;
        }

        if (this.childNodes) {
            var childNodes = [];
            this.childNodes.forEach(function (archNode) {
                var json = archNode.toJSON(options);
                if (json) {
                    if (json.type !== 'FRAGMENT' || json.nodeName || json.nodeValue) {
                        childNodes.push(json);
                    } else if (json.childNodes) {
                        childNodes = childNodes.concat(json.childNodes);
                    }
                }
            });
            if (childNodes.length) {
                data.childNodes = childNodes;
            }
        }

        if (this.isVirtual()) {
            data.isVirtual = true;
            if (!options || !options.keepVirtual) {
                return data;
            }
        }

        if (this.nodeName) {
            data.nodeName = this.nodeName;
        }
        if (this.nodeValue) {
            data.nodeValue = this.nodeValue;
        }
        if (this.attributes) {
            var attributes = this.attributes.toJSON();
            if (attributes.length) {
                data.attributes = attributes;
            }
        }

        return data;
    }
    /**
     * Get a string representation of the ArchNode and its children.
     *
     * @param {Object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @param {boolean} [options.showIDs] true to show the arch node id's
     * @returns {JSON}
     **/
    toString (options) {
        options = options || {};
        var string = '';

        if (this.nodeName && (!this.isVirtual() || options.keepVirtual) && !options.onlyText) {
            string += '<' + this.nodeName;
            var attributes = this.attributes.toString(options);
            if (attributes.length) {
                string += ' ';
                string += attributes;
            }
            if (options.showIDs) {
                string += ' archID="' + this.id + '"';
            }
            if (this.isVoid() && !this.childNodes.length) {
                string += '/';
            }
            string += '>';
        }
        var i = 0;
        while (i < this.childNodes.length) {
            string += this.childNodes[i].toString(options);
            i++;
        }
        if (this.nodeName && (!this.isVirtual() || options.keepVirtual) && !options.onlyText && (!this.isVoid() || this.childNodes.length)) {
            string += '</' + this.nodeName + '>';
        }
        return string;
    }

    //--------------------------------------------------------------------------
    // Public: GETTER (browsing)
    //--------------------------------------------------------------------------

    /**
     * Find the first ancestor (last if `findGreatest` is true)
     * that matches the given predicate function.
     *
     * @param {string|function(ArchNode)} fn
     * @param {boolean} [findGreatest]
     * @returns {ArchNode|undefined}
     */
    ancestor (fn, findGreatest) {
        var match;
        var parent = this;
        while (parent) {
            if (typeof fn === 'string' ? parent[fn] && parent[fn].call(parent, parent) : fn.call(parent, parent)) {
                match = parent;
                if (!findGreatest) {
                    break;
                }
            }
            parent = parent.parent;
        }
        return match;
    }
    /**
     * Find all ancestors that match the given predicate function.
     *
     * @param {function(ArchNode)} fn
     * @returns {ArchNode []}
     */
    ancestors (fn) {
        var res = [];
        var ancestor = this;
        while (ancestor) {
            ancestor = ancestor.ancestor(fn);
            if (ancestor) {
                res.push(ancestor);
                ancestor = ancestor.parent;
            }
        }
        return res;
    }
    /**
     * Find an ArchNode; following a path from this ArchNode,
     * moving from nth child to nth child.
     *
     * @param {int []} path
     * @returns {ArchNode}
     */
    applyPath (path) {
        var node = this;
        while (node && path.length) {
            node = node.childNodes[path.shift()];
        }
        return node;
    }
    /**
     * Return the IDs of this ArchNode's children.
     *
     * @returns {int []}
     */
    childNodesIDs () {
        var ids = [];
        if (this.childNodes) {
            this.childNodes.forEach(function (node) {
                ids.push(node.id);
            });
        }
        return ids;
    }
    /**
     * Return the common ancestor between this ArchNode and another, if any.
     *
     * @param {ArchNode} otherArchNode
     * @returns {ArchNode|null}
     */
    commonAncestor (otherArchNode) {
        var ancestors = this.listAncestor();
        for (var n = otherArchNode; n; n = n.parent) {
            if (ancestors.indexOf(n) > -1) {
                return n;
            }
        }
        return null; // difference document area
    }
    /**
     * Return true if this ArchNode contains the given ArchNode.
     *
     * @param {ArchNode} archNode
     * @returns {boolean}
     */
    contains (archNode) {
        var parent = archNode.parent;
        while (parent && parent !== this) {
            parent = parent.parent;
        }
        return !!parent;
    }
    /**
     * Find all descendent that matches the given predicate function.
     *
     * @param {function(ArchNode)|string} fn
     * @param {boolean} [searchInsideMatchedArchNode] true to search inside the already
     *   matched archNodes
     * @returns {ArchNode[]}
     */
    descendents (fn, searchInsideMatchedArchNode) {
        var nodes = [];
        if (this.childNodes) {
            for (var k = 0, len = this.childNodes.length; k < len; k++) {
                var child = this.childNodes[k];
                if (typeof fn === 'string' ? child[fn] && child[fn](child) : fn(child)) {
                    nodes.push(child);
                    if (searchInsideMatchedArchNode) {
                        nodes = nodes.concat(child.descendents(fn, searchInsideMatchedArchNode));
                    }
                } else {
                    nodes = nodes.concat(child.descendents(fn, searchInsideMatchedArchNode));
                }
            }
        }
        return nodes;
    }
    /**
     * Return the ArchNode's first child or its first descendent to match the
     * predicate function if any, or null if none was found.
     *
     * @param {function(ArchNode)} [fn] (`this` is the same as its argument)
     * @returns {ArchNode|null}
     */
    firstChild (fn) {
        var first = this.childNodes && this.childNodes.length ? this.childNodes[0] : null;
        if (!first || !fn || fn.call(first, first)) {
            return first;
        }
        return first.firstChild(fn);
    }
    /**
     * Return the ArchNode's first leaf (can be itself).
     * The first leaf is the first descendent without children.
     *
     * @returns {ArchNode}
     */
    firstLeaf () {
        return this.firstChild(function (child) {
            return !child.firstChild();
        }) || this;
    }
    /**
     * Get an ArchNode by ID, that is contained within this ArchNode,
     * itself included.
     *
     * @param {int} id
     * @returns {ArchNode|undefined}
     */
    getNode (id) {
        if (this.id === id) {
            return this;
        }
        if (this.childNodes) {
            for (var k = 0, len = this.childNodes.length; k < len; k++) {
                var archNode = this.childNodes[k].getNode(id);
                if (archNode) {
                    return archNode;
                }
            }
        }
    }
    /**
     * Return an array with the ids of all the nodes between this and `end`, not included.
     *
     * @private
     * @param {ArchNode} end
     * @param {object} [options]
     * @param {object} [options.includeStart] true to include this
     * @param {object} [options.includeEnd] true to include `end`
     * @returns {number []}
     */
    getNodesUntil (end, options) {
        options = options || {};
        var start = this.firstLeaf();
        end = end.lastLeaf();
        var nodes = options.includeStart && start.isInArch() ? [start.id] : [];
        var nextOptions = {
            doNotInsertVirtual: true,
            leafToLeaf: true,
        };
        if (start.id === end.id) {
            return options.includeEnd && !options.includeStart ? nodes.concat(end.id) : nodes;
        }
        start.nextUntil(function (node) {
            if (node.isInArch() && (node.id !== end.id || options.includeEnd && end.isInArch())) {
                nodes.push(node.id);
            }
            return node.id === end.id;
        }, nextOptions);
        return we3.utils.uniq(nodes);
    }
    /**
     * Get the index of this ArchNode with regards to its parent.
     *
     * @returns {int}
     */
    index () {
        return this.parent.childNodes.indexOf(this);
    }
    /**
     * Return the ArchNode's last child or its last descendent to match the
     * predicate function if any, or null if none was found.
     *
     * @param {function(ArchNode)} [fn] (`this` is the same as its argument)
     * @returns {ArchNode|null}
     */
    lastChild (fn) {
        var last = this.childNodes && this.childNodes.length ? this.childNodes[this.childNodes.length - 1] : null;
        if (!last || !fn || fn.call(last, last)) {
            return last;
        }
        return last.lastChild(fn);
    }
    /**
     * Return the ArchNode's last leaf (can be itself).
     * The last leaf is the last descendent without children.
     *
     * @returns {ArchNode}
     */
    lastLeaf () {
        return this.lastChild(function (child) {
            return !child.lastChild();
        }) || this;
    }
    /**
     * Return the length of this ArchNode (the number of children it has).
     *
     * @returns {int}
     */
    length () {
        return this.childNodes.length;
    }
    /**
     * List all ancestors until predicate hit if any.
     *
     * @param {function(ArchNode)} [pred]
     * @returns {ArchNode []}
     */
    listAncestor (pred) {
        var ancestors = [];
        this.ancestor(function (el) {
            if (!el.isContentEditable()) { // todo: check (why?)
                ancestors.push(el);
            }
            return pred ? pred(el) : false;
        });
        return ancestors;
    }
    /**
     * Return the next node, following a pre-order tree traversal.
     *
     * @see _prevNextUntil
     * @param {Object} [options]
     * @param {Boolean} [options.doCrossUnbreakables] true to ignore unbreakable rules and indeed cross unbreakables
     * @param {Boolean} [options.doNotInsertVirtual] true to prevent the insertion of virtual nodes
     * @param {Boolean} [options.leafToLeaf] true to only give leaf nodes and skip parents
     * @param {Boolean} [options.stopAtBlock] true to prevent passing through blocks
     * @returns {ArchNode|null}
     */
    next (options) {
        var unbreakableContainer = this.ancestor('isUnbreakable');
        return this._prevNextUntil(unbreakableContainer, false, null, options);
    }
    /**
     * Return the ArchNode's next sibling if any.
     * If a predicate function is passed, return the
     * first next sibling that matches it.
     *
     * @param {function(ArchNode)} [fn]
     * @param {boolean} [doNotSkipNotEditables] todo: check this
     * @returns {ArchNode|null}
     */
    nextSibling (fn, doNotSkipNotEditables) {
        if (!this.parent) {
            return null;
        }
        var next = this.parent.childNodes[this.index() + 1];
        return next ? next._nextSibling(fn, doNotSkipNotEditables) : null;
    }
    /**
     * Return the next node until predicate hit or end of tree,
     * following a pre-order tree traversal.
     *
     * @see _prevNextUntil
     * @param {function (ArchNode)} [fn] called on this and takes the previous/next node as argument
     *          return true if the requested node was found
     * @param {Object} [options]
     * @param {Boolean} [options.doCrossUnbreakables] true to ignore unbreakable rules and indeed cross unbreakables
     * @param {Boolean} [options.doNotInsertVirtual] true to prevent the insertion of virtual nodes
     * @param {Boolean} [options.leafToLeaf] true to only give leaf nodes and skip parents
     * @param {Boolean} [options.stopAtBlock] true to prevent passing through blocks
     * @returns {ArchNode|null}
     */
    nextUntil (fn, options) {
        var unbreakableContainer = options && options.doNotLeaveNode ? this : this.ancestor('isUnbreakable');
        return this._prevNextUntil(unbreakableContainer, false, fn, options);
    }
    /**
     * Return the (zero-indexed) nth child of the archNode.
     *
     * @param {Number} n
     * @returns {ArchNode|undefined}
     */
    nthChild (n) {
        return this.childNodes[n];
    }
    /**
     * Return the path from the given `ancestor` to this ArchNode,
     * from childNode to childNode (by index).
     *
     * @param {ArchNode} ancestor
     * @returns {int []}
     */
    path (ancestor) {
        var path = [];
        var node = this;
        while (node.parent && node.parent !== ancestor) {
            path.unshift(node.index());
            node = node.parent;
        }
        return path;
    }
    /**
     * Return the previous node, following a pre-order tree traversal.
     *
     * @see _prevNextUntil
     * @param {Object} [options]
     * @param {Boolean} [options.doCrossUnbreakables] true to ignore unbreakable rules and indeed cross unbreakables
     * @param {Boolean} [options.doNotInsertVirtual] true to prevent the insertion of virtual nodes
     * @param {Boolean} [options.doNotLeaveNode] true to prevent leaving the current node
     * @param {Boolean} [options.leafToLeaf] true to only give leaf nodes and skip parents
     * @param {Boolean} [options.stopAtBlock] true to prevent passing through blocks
     * @returns {ArchNode|null}
     */
    prev (options) {
        var unbreakableContainer = options && options.doNotLeaveNode ? this : this.ancestor('isUnbreakable');
        return this._prevNextUntil(unbreakableContainer, true, null, options);
    }
    /**
     * Return the ArchNode's previous sibling if any.
     * If a predicate function is passed, return the
     * first previous sibling that matches it.
     *
     * @param {function(ArchNode)} [fn]
     * @param {boolean} [doNotSkipNotEditables] todo: check this
     * @returns {ArchNode|null}
     */
    previousSibling (fn, doNotSkipNotEditables) {
        if (!this.parent) {
            return false;
        }
        var prev = this.parent.childNodes[this.index() - 1];
        return prev && prev._previousSibling(fn, doNotSkipNotEditables);
    }
    /**
     * Return the previous node until predicate hit or end of tree,
     * following a pre-order tree traversal.
     *
     * @see _prevNextUntil
     * @param {function (ArchNode)} [fn] called on this and takes the previous/next node as argument
     *          return true if the requested node was found
     * @param {Object} [options]
     * @param {Boolean} [options.doCrossUnbreakables] true to ignore unbreakable rules and indeed cross unbreakables
     * @param {Boolean} [options.doNotInsertVirtual] true to prevent the insertion of virtual nodes
     * @param {Boolean} [options.leafToLeaf] true to only give leaf nodes and skip parents
     * @param {Boolean} [options.stopAtBlock] true to prevent passing through blocks
     * @returns {ArchNode|null}
     */
    prevUntil (fn, options) {
        var unbreakableContainer = options && options.doNotLeaveNode ? this : this.ancestor('isUnbreakable');
        return this._prevNextUntil(unbreakableContainer, true, fn, options);
    }
    /**
     * Get a representation of the Arch with architectural space, node IDs and virtual nodes
     *
     * @param {boolean} noArchitectural true to not show architectural space
     * @returns {string}
     */
    repr (noArchitectural) {
        return this.parent && this.parent.repr(noArchitectural);
    }
    /**
     * Return a list of child nodes that are not architectural space.
     *
     * @returns {ArchNode []}
     */
    visibleChildren () {
        if (!this.childNodes) {
            return;
        }
        var visibleChildren = [];
        this.childNodes.forEach(function (child) {
            if (!child.isArchitecturalSpace()) {
                visibleChildren.push(child);
            }
        });
        return visibleChildren;
    }
    /**
     * Return the next or previous node (if any), following a pre-order tree traversal.
     * Return null if no node was found.
     * If a function is provided, apply it to the node that was found, if any.
     *
     * @param {Boolean} isPrev true to get the previous node, false for the next node
     * @param {Function (ArchNode)} [fn] called on this and takes the previous/next node as argument
     */
    walk (isPrev, fn) {
        var next = this[isPrev ? '_walkPrev' : '_walkNext']();
        if (next && fn) {
            fn.call(this, next);
        }
        return next;
    }

    //--------------------------------------------------------------------------
    // Public: SETTER (todo: check which ones should be private)
    //--------------------------------------------------------------------------

    /**
     * Add a newline within the ArchNode, at given offset
     * (split a paragraph, add a list item...).
     *
     * @param {int} offset
     */
    addLine (offset) {
        if (!this.isInFlowBlock()) {
            return;
        }

        if (!this.isAllowUpdate()) {
            console.warn("can not split a not editable node");
            return;
        }

        var child = this.childNodes[offset];
        var isChildRightEdgeVirtual = child && child.isRightEdge() && child.isVirtual();
        if (isChildRightEdgeVirtual && !this.isUnbreakable() && (this.isFormatNode() || this.isPara())) {
            var virtual = this.childNodes[offset];
            this.after(virtual);
            if (this.isEmpty()) {
                this.append(this.params.create());
            }
            return virtual.parent.addLine(virtual.index());
        }
        var next = this.split(offset);
        if (!this.childNodes.length) {
            this.insert(this.params.create('br'), offset);
        }
        if (!next) {
            return;
        }
        if (!next.childNodes.length) {
            next.insert(this.params.create('br'), offset);
        }

        if (!next.isFlowBlock() || next.isInLi() && !next.isLi()) {
            return next.parent.addLine(next.index());
        }
        return;
    }
    /**
     * Insert an archNode or a fragment after the current archNode
     *
     * @param {ArchNode} archNode
     * @returns {ArchNode []} the inserted ArchNodes
     */
    after (archNode) {
        return this.parent.insertAfter(archNode, this);
    }
    /**
     * Insert an archNode or a fragment at the end of the current archNode's children
     *
     * @param {ArchNode} archNode
     * @returns {ArchNode []} the inserted ArchNodes
     */
    append (archNode) {
        return this._changeParent(archNode, this.childNodes.length);
    }
    /**
     * Insert an archNode or a fragment before the current archNode
     *
     * @param {ArchNode} archNode
     * @returns {ArchNode []} the inserted ArchNodes
     */
    before (archNode) {
        return this.parent.insertBefore(archNode, this);
    }
    /**
     * Delete the edges between this node and its siblings of which it's at the
     * left or right edge (given the value of `isLeft`), from top to bottom.
     *
     * @param {Boolean} [isLeft] true to delete the left edge
     * @param {Object} [options]
     * @param {Boolean} [options.doNotBreakBlocks] true to prevent the merging of block-type nodes
     * @param {Boolean} [options.doNotRemoveEmpty] true to prevent the removal of empty nodes
     * @param {Boolean} [options.keepRight] true to always merge an empty node into its next node and not the other way around
     * @param {Boolean} [options.mergeOnlyIfSameType] true to prevent the merging of nodes of different types (eg p & h1)
     * @returns {ArchNode} self, for range purposes
     */
    deleteEdge (isLeft, options) {
        var self = this;
        options = options || {};
        var edges = this._edgesToDelete(isLeft, options.doNotBreakBlocks);
        edges.reverse().slice().forEach(function (node) {
            var next = node[isLeft ? 'previousSibling' : 'nextSibling'](null, true);
            if (!next) {
                return;
            }
            self._deleteEdge(node, next, isLeft, options);
        });
        return this;
    }
    /**
     * Remove all the children of this ArchNode.
     */
    empty () {
        if (!this.isAllowUpdate()) {
            console.warn("cannot empty a non editable node");
            return;
        }
        this.childNodes.slice().forEach(function (archNode) {
            archNode.remove();
        });
        this._triggerChange(0);
    }
    /**
     * Insert an archNode or a fragment at the given offset of this ArchNode.
     *
     * @param {ArchNode} archNode
     * @param {int} offset
     * @returns {ArchNode []} the inserted ArchNodes
     */
    insert (archNode, offset) {
        if (!this.isAllowUpdate()) {
            console.warn("can not insert a item in a not editable node");
            return [];
        }
        if (archNode.isFragment()) {
            return this._insertFragment(archNode, offset);
        }
        if (this.isVoidoid()) {
            if (!this.parent) {
                return [];
            }
            var index = offset ? this.index() + 1 : this.index();
            return this.parent.insert(archNode, index);
        }
        if (this.isFormatNode() && archNode.isBlock()) {
            var next = this.split(offset);
            var res = next.before(archNode);
            if (next.isEmpty()) {
                next.remove();
            }
            return res;
        }
        archNode._triggerChange(archNode.length());
        var ref = this.childNodes[offset];
        return ref ? this.insertBefore(archNode, ref) : this.append(archNode);
    }
    /**
     * Insert an archNode or a fragment after `ref`.
     *
     * @param {ArchNode} archNode
     * @param {ArchNode} ref
     * @returns {ArchNode []} the inserted ArchNodes
     */
    insertAfter (archNode, ref) {
        if (!ref) {
            ref = this;
        }
        return this._changeParent(archNode, ref.index() + 1);
    }
    /**
     * Insert an archNode or a fragment before `ref`.
     *
     * @param {ArchNode} archNode
     * @param {ArchNode} ref
     * @returns {ArchNode []} the ids of the inserted ArchNodes
     */
    insertBefore (archNode, ref) {
        return this._changeParent(archNode, ref.index());
    }
    /**
     * Insert an archNode or a fragment at the beginning of the current archNode's children
     *
     * @param {ArchNode} archNode
     * @returns {ArchNode []} the inserted ArchNodes
     */
    prepend (archNode) {
        return this._changeParent(archNode, 0);
    }
    /**
     * Remove this ArchNode.
     */
    remove () {
        if (this.parent) {
            if (!this.parent.isAllowUpdate()) {
                console.warn("cannot remove a node in a non editable node");
                return;
            }
            var offset = this.index();
            this.parent.childNodes.splice(offset, 1);
            this.parent._triggerChange(offset);
        }
        this.params.remove(this);
        this.parent = null;
    }
    /**
     * Remove this ArchNode if it has no children.
     *
     * @param {Boolean} keepVirtual true not to consider virtual nodes as blank
     */
    removeIfEmpty (keepVirtual) {
        if (this.isEmpty(keepVirtual)) {
            this.remove();
        }
    }
    /**
     * Remove to the left of the ArchNode, at given offset.
     *
     * @param {int} offset
     * @returns {ArchNode} the node that will be focused after removing
     */
    removeLeft (offset) {
        return this._removeSide(offset, true);
    }
    /**
     * Remove to the left of the ArchNode, at given offset.
     *
     * @param {int} offset
     * @returns {ArchNode} the node that will be focused after removing
     */
    removeRight (offset) {
        return this._removeSide(offset, false);
    }
    /**
     * Split this ArchNode at given offset, if possible.
     * Return the ArchNode on the right hand side of the split.
     *
     * @param {int} offset
     * @param {boolean} [removeEmpty] true to remove generated empty nodes
     * @returns {ArchNode|undefined}
     */
    split (offset, removeEmpty) {
        if (this.isUnbreakable()) {
            console.warn("cannot split an unbreakable node");
            return;
        }

        if (!this.isAllowUpdate()) {
            console.warn("cannot split a non editable node");
            return;
        }

        var Constructor = this.constructor;
        var archNode = new Constructor(this.params, this.nodeName, this.attributes ? this.attributes.toJSON() : []);
        archNode._triggerChange(0);

        if (this.childNodes) {
            var childNodes = this.childNodes.slice(offset);
            while (childNodes.length) {
                archNode.prepend(childNodes.pop());
            }
        }

        this.after(archNode);
        if (removeEmpty && !this.isText()) {
            this._removeEmptySiblings();
        }
        return archNode;
    }
    /**
     * Split the current node's parent at both edges of this node.
     */
    splitAround () {
        // split at start if not on left edge
        if (this.index()) {
            this.parent.split(this.index(), true);
        }
        // split at end if not on right edge
        if (this.index() + 1 < this.parent.length()) {
            this.parent.split(this.index() + 1, true);
        }
    }
    /**
     * Split this ArchNode at given offset, if possible.
     * Keep splitting the parents until the given ancestor was split.
     * Return the ArchNode on the right hand side of the split.
     *
     * @todo harmonize return with split (more consistency)
     * @param {ArchNode|function} ancestor
     * @param {int} offset
     * @returns {ArchNode|undefined}
     */
    splitUntil (ancestor, offset) {
        if (this.isUnbreakable()) {
            return this;
        }
        var right = this.split(offset) || this;
        var done = typeof ancestor === 'function' ? ancestor(this) : this === ancestor;
        return done ? this : right.parent.splitUntil(ancestor, right.index());
    }
    /**
     * Unwrap this ArchNode from its parent.
     */
    unwrap () {
        if (this.parent.isRoot()) {
            console.warn('cannot unwrap from root node');
            return;
        }
        if (this.parent.parent && !this.parent.parent.isAllowUpdate()) {
            console.warn("cannot unwrap a node in a non editable node");
            return;
        }
        var start = this.parent.split(this.index() + 1);
        this.parent.split(this.index());
        var parent = this.parent;
        parent.before(this);
        parent.remove();
        // Remove generated empty nodes
        if (start) {
            start.removeIfEmpty();
        }
        this._cleanAfterUnwrap();
    }
    /**
     * Wrap the node corresponding to the given ID inside
     * a new ArchNode with the given nodeName.
     *
     * @param {Number} id
     * @param {String} nodeName
     * @returns {ArchNode|null}
     */
    wrap (nodeName) {
        if (!this.parent.isAllowUpdate()) {
            console.warn("cannot wrap a node in a non editable node");
            return;
        }
        var wrapper = this.params.create(nodeName);
        this.before(wrapper);
        wrapper.append(this);
        this.params.change(this, null);
        wrapper._deleteEdges({
            doNotBreakBlocks: true,
            doNotRemoveEmpty: true,
            mergeOnlyIfSameType: true,
        });
        return wrapper;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Move the given ArchNode to this ArchNode's children at given index.
     *
     * @private
     * @param {ArchNode|ArchFragment} archNode
     * @param {int} index
     * @returns {ArchNode []} the inserted ArchNodes
     */
    _changeParent (archNode, index) {
        if (this.isVoid()) {
            throw new Error("You can't add a node into a void node");
        }
        if (!this.childNodes) {
            throw new Error("You can't add a child into this node");
        }
        if (!this.isAllowUpdate()) {
            console.warn("cannot add a node into a non editable node");
            return [];
        }
        if (archNode.parent && !archNode.parent.isAllowUpdate()) {
            console.warn("cannot remove a node from a non editable node");
            return [];
        }
        if (this.ancestor(function (node) { return node === archNode;})) {
            console.warn("cannot add a node into itself");
            return [];
        }

        if (archNode.isFragment()) {
            var changeOne = archNode => this._changeParent(archNode, index++);
            var res = we3.utils.flatMap(archNode.childNodes.slice(), changeOne);
            archNode.remove();
            return res;
        }

        if (archNode.parent) {
            if (archNode.parent === this && archNode.index() < index) {
                index--;
            }
            var i = archNode.parent.childNodes.indexOf(archNode);
            archNode.parent._triggerChange(i);
            archNode.parent.childNodes.splice(i, 1);
        }

        archNode.parent = this;
        this.childNodes.splice(index, 0, archNode);
        archNode._triggerChange(null);
        archNode.__removed = false;

        this.params.add(archNode);

        this._triggerChange(index);
        return [archNode];
    }
    /**
     * Perform the required cleaning operations after merging two nodes (can be
     * overridden by custom ArchNodes). This is called on the node that stays
     * after merging.
     *
     * @private
     * @param {boolean} isLeft true if the merge took place from right to left
     */
    _cleanAfterMerge (isLeft) {}
    /**
     * Clean the Arch after performing an unwrap:
     * - Remove generated empty nodes
     * - Delete new edges
     *
     * @private
     */
    _cleanAfterUnwrap () {
        var prev = this.previousSibling();
        if (prev) {
            prev.removeIfEmpty();
        }
        /* Delete new edges if needed
        eg: <b>1<i>2</i>3</b> => unwrap 2 from i
            => <b>1</b><b>2</b><b>3</b>
            => <b>123</b> */
        var deleteEdgeOptions = {
            doNotBreakBlocks: true,
            mergeOnlyIfSameType: true,
            doNotRemoveEmpty: true,
        };
        var last = this.lastLeaf();
        this.firstLeaf().deleteEdge(true, deleteEdgeOptions);
        last.deleteEdge(false, deleteEdgeOptions);
    }
    /**
     * Delete the edge between `node` and `next` if possible.
     *
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @param {boolean} isLeft
     * @param {object} [options]
     * @param {boolean} [options.doNotRemoveEmpty] true to prevent the removal of empty nodes
     * @param {Boolean} [options.keepRight] true to always merge an empty node into its next node and not the other way around
     * @param {boolean} [options.mergeOnlyIfSameType] true to prevent the merging of nodes of different types (eg p & h1)
     */
    _deleteEdge (node, next, isLeft, options) {
        // delete edge where node is an empty node that should be removed
        if (!options.doNotRemoveEmpty && node.isDeepEmpty() && !node.isVoid()) {
            return this._deleteEdgeEmpty(node, next, isLeft, options.keepRight);
        }
        // merge a format node with a list (eg: p with ul)
        var isFormatVSList = node.isFormatNode() && next.isList() ||
                             node.isList() && next.isFormatNode();
        if (isFormatVSList) {
            return this._deleteEdgeFormatVSList(node, next, isLeft);
        }
        // merge nodes of different types (eg: p with h1)
        if (!options.mergeOnlyIfSameType && this._isMergeableDifferentTypes(node, next)) {
            return this._deleteEdgeDifferentTypes(node, next, isLeft);
        }
        // regular merge
        if (this._isMergeableSameType(node, next)) {
            node._mergeInto(next, isLeft);
        }
    }
    /**
     * Delete the edge where `node` and `next`, where `node` is
     * an empty node that should be removed.
     *
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @param {boolean} isLeft
     * @param {boolean} keepRight true to merge the empty node into
     *      its next node, no matter the value of `isLeft`
     */
    _deleteEdgeEmpty (node, next, isLeft, keepRight) {
        if (next.isVoid() || next.isText()) {
            node.childNodes.forEach(node => node.unwrap());
        } else {
            var goes = isLeft || keepRight ? node : next;
            var stays = isLeft || keepRight ? next : node;
            goes._mergeInto(stays, isLeft);
        }
    }
    /**
     * Merge a format node with a list (eg: p with ul).
     *
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @param {boolean} isLeft
     */
    _deleteEdgeFormatVSList (node, next, isLeft) {
        var isNodeList = node.isList();
        var list = isNodeList ? node : next;
        var formatNode = isNodeList ? next : node;
        isLeft = isNodeList ? !isLeft : isLeft;
        var childOfLi = this._getElementInLi(list, isLeft);
        if (isLeft) {
            childOfLi.after(formatNode);
        } else {
            this._moveItemOutOfList(childOfLi, formatNode);
        }
        if (this._isMergeableSameType(formatNode, childOfLi)) {
            formatNode._mergeInto(childOfLi, isLeft);
        }
    }
    /**
     * Merge `node` with `next`, where `node` and `next` are nodes
     * of different types. Eg: a p and a h1.
     *
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @param {boolean} isLeft
     */
    _deleteEdgeDifferentTypes (node, next, isLeft) {
        // non-similar merging always happens from right to left:
        // we keep the left-most node's type on backspace and on delete
        if (node.nextSibling() === next) {
            next._mergeInto(node, true);
        } else {
            node._mergeInto(next, isLeft);
        }
    }
    /**
     * Delete this ArchNode's left and right edges.
     *
     * @see deleteEdge
     * @param {object} [options]
     * @param {Boolean} [options.doNotBreakBlocks] true to prevent the merging of block-type nodes
     * @param {Boolean} [options.doNotRemoveEmpty] true to prevent the removal of empty nodes
     * @param {Boolean} [options.keepRight] true to always merge an empty node into its next node and not the other way around
     * @param {Boolean} [options.mergeOnlyIfSameType] true to prevent the merging of nodes of different types (eg p & h1)
     */
    _deleteEdges (options) {
        var prev = this.previousSibling();
        if (prev) {
            prev.deleteEdge(false, Object.assign({}, options, { keepRight: true }));
        }
        var next = this.nextSibling();
        if (next) {
            next.deleteEdge(true, options);
        }
    }
    /**
     * Return a list of edges that will have to be checked for deletion,
     * starting with this node and moving up to its parents
     *
     * @param {boolean} isLeft
     * @param {boolean} [doNotBreakBlocks] true to prevent the merging of block-type nodes
     * @returns {ArchNode []}
     */
    _edgesToDelete (isLeft, doNotBreakBlocks) {
        var node = this;
        var edges = [];
        while (node && !node.isRoot() && (!doNotBreakBlocks || !node.isBlock())) {
            if (!node.isText()) {
                edges.push(node);
            }
            if (!node.parent || !node[isLeft ? 'isLeftEdgeOf' : 'isRightEdgeOf'](node.parent)) {
                break;
            }
            node = node.parent;
        }
        return edges;
    }
    /**
     * Return a fragment containing a given list of child nodes.
     *
     * @param {ArchNode []} children
     * @returns {ArchNodeFragment}
     */
    _fragmentWithChildren (children) {
        var fragment = new we3.ArchNodeFragment(this.params);
        children.slice().forEach(fragment.append.bind(fragment));
        return fragment;
    }
    /**
     * From a list node, return the first (or last if `isLast` is true) non-text node
     * that is the direct child of a list item. If there is none (ie there is text directly
     * within the list item), wrap the list item's content in a paragraph element and return that.
     *
     * @param {ArchNode} list
     * @param {boolean} [isLast]
     * @returns {ArchNode}
     */
    _getElementInLi (list, isLast) {
        var method = isLast ? 'lastChild' : 'firstChild';
        var childOfLi = list[method](child => child.parent.isLi() && !child.isList());
        return childOfLi.isText() ? childOfLi.wrap('p') : childOfLi;
    }
    /**
     * Insert a fragment at the given offset of this ArchNode.
     *
     * @param {ArchNodeFragment} fragment
     * @param {int} offset
     * @returns {ArchNode []} the inserted ArchNodes
     */
    _insertFragment (fragment, offset) {
        if (!fragment.childNodes.length) {
            return [];
        }
        var lastInserted = this.insert(fragment.childNodes[0], offset)[0];
        if (fragment.childNodes.length) {
            var others;
            if (lastInserted.isText()) {
                others = lastInserted.insert(fragment, lastInserted.length());
            } else {
                others = lastInserted.after(fragment);
            }
            return [lastInserted].concat(others);
        }
        return [lastInserted];
    }
    /**
     * Return true if `node` and `next` are elements of different types that
     * can be merged (eg: an h1 with a p).
     *
     * @private
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @returns {boolean}
     */
    _isMergeableDifferentTypes (node, next) {
        var isBlockVSFormat = node.isBlock() && next.isFormatNode();
        var areBothLists = node.isList() && next.isList();
        return !this._isMergeableSameType(node, next) &&
            !this._isMergeForbidden(node, next) &&
            (isBlockVSFormat || areBothLists);
    }
    /**
     * Return true if `node` and `next` are elements of the same type that
     * can be merged.
     * That is, they have the same node names, the same attributes,
     * and the same classes.
     *
     * @private
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @returns {boolean}
     */
    _isMergeableSameType (node, next) {
        var haveSameNodeNames = node.nodeName === next.nodeName;
        var haveSameAttributes = node.attributes.isEqual(next.attributes);
        var haveSameClasses = node.className.isEqual(next.className);
        return !this._isMergeForbidden(node, next) && haveSameNodeNames && haveSameAttributes && haveSameClasses;
    }
    /**
     * Return true if it is forbidden to merge `node` and `next`
     * (ie it would imply crossing unbreakables or merging two `br` nodes).
     *
     * @param {ArchNode} node
     * @param {ArchNode} next
     * @returns {boolean}
     */
    _isMergeForbidden (node, next) {
        var isCrossUnbreakables = node.ancestor('isUnbreakable') !== next.ancestor('isUnbreakable');
        var hasBR = node.isBR() || next.isBR();
        return isCrossUnbreakables || hasBR;
    }
    /**
     * Merge this ArchNode into `next`.
     *
     * @private
     * @param {ArchNode} next
     * @param {boolean} isLeft true if the merge is happening from right to left
     */
    _mergeInto (next, isLeft) {
        // handle edge BRs
        var edge = this[isLeft ? 'firstLeaf' : 'lastLeaf']();
        var nextEdge = next[isLeft ? 'lastLeaf' : 'firstLeaf']();
        if (nextEdge.isPlaceholderBR() || nextEdge.isBR() && nextEdge.isAfterBR()) {
            nextEdge.remove();
        } else if (edge.isPlaceholderBR() || edge.isBR() && edge.isAfterBR()) {
            edge[isLeft ? 'before' : 'after'](this.params.create());
            edge.remove();
        }
        // try to merge elements with mixed indentations
        var didMergeMixedIndents = this._mergeMixedIndents(isLeft, next);
        if (didMergeMixedIndents) {
            return;
        }
        // move the children to their new parent and remove the old parent
        var childNodes = this.childNodes.slice();
        var fragment = this._fragmentWithChildren(childNodes);
        next[isLeft ? 'append' : 'prepend'](fragment);
        this.remove();
        next._cleanAfterMerge(isLeft);
    }
    /**
     * Merge an indented list with a non-indented list item if needed.
     * Return false if this is irrelevant.
     *
     * @private
     * @param {Boolean} isLeft
     * @param {ArchNode} next
     * @returns {Boolean} true if handled
     */
    _mergeMixedIndents (isLeft, next) {
        var node = isLeft ? next : this;
        next = isLeft ? this : next;
        if (node.isParentOfIndentedList() && !next.isParentOfIndentedList()) {
            node.lastChild(node.isLi).after(next);
            next.deleteEdge(true);
            return true;
        }
        if (next.isParentOfIndentedList() && !node.isParentOfIndentedList()) {
            var nextLi = next.firstChild(next.isLi);
            node.after(nextLi);
            next.remove();
            nextLi.deleteEdge(true);
            return true;
        }
        return false;
    }
    /**
     * Move a child of a list item out of its list and after `otherNode`.
     *
     * @param {ArchNode} childOfLi
     * @param {ArchNode} otherNode
     */
    _moveItemOutOfList (childOfLi, otherNode) {
        var li = childOfLi.parent;
        var parent = li.parent;
        otherNode.after(childOfLi);
        li.remove();
        while (parent && parent.isEmpty() && !parent.isRoot()) {
            var ancestor = parent.parent;
            parent.remove();
            parent = ancestor;
        }
    }
    /**
     * Return the ArchNode's next sibling if any.
     * If a predicate function is passed, return the
     * first next sibling that matches it.
     *
     * @private
     * @param {function(ArchNode)} [fn]
     * @param {boolean} [doNotSkipNotEditables] todo: check this
     * @returns {ArchNode|null}
     */
    _nextSibling (fn, doNotSkipNotEditables) {
        // todo: check the use of isEditable here
        if ((doNotSkipNotEditables || this.isAllowUpdate()) && (!fn || fn(this))) {
            return this;
        } else {
            return this.nextSibling(fn);
        }
    }
    /**
     * Return the ArchNode's previous sibling if any.
     * If a predicate function is passed, return the
     * first previous sibling that matches it.
     *
     * @private
     * @param {function(ArchNode)} [fn]
     * @param {boolean} [doNotSkipNotEditables] todo: check this
     * @returns {ArchNode|null}
     */
    _previousSibling (fn, doNotSkipNotEditables) {
        if ((doNotSkipNotEditables || this.isAllowUpdate()) && (!fn || fn(this))) {
            return this;
        } else {
            return this.previousSibling(fn);
        }
    }
    /**
     * Return the next or previous node until predicate hit or end of tree,
     * following a pre-order tree traversal.
     * This ignores architectural space and prevents getting out of an unbreakable node.
     * If no suitable previous/next node is found, a virtual text node will be inserted and
     * returned. If the insertion is not allowed, return null.
     * If no predicate function is provided, just give the previous/next node.
     *
     * @private
     * @param {boolean} isPrev true to get the previous node, false for the next node
     * @param {function (ArchNode)} [pred] called on this and takes the previous/next node as argument
     *          return true if the requested node was found
     * @param {Object} [options]
     * @param {Boolean} [options.doCrossUnbreakables] true to ignore unbreakable rules and indeed cross unbreakables
     * @param {Boolean} [options.doNotInsertVirtual] true to prevent the insertion of virtual nodes
     * @param {Boolean} [options.leafToLeaf] true to only give leaf nodes and skip parents
     * @param {Boolean} [options.stopAtBlock] true to prevent passing through blocks
     * @returns {ArchNode|null}
     **/
    _prevNextUntil (unbreakableContainer, isPrev, pred, options) {
        options = options || {};
        var node = this;
        while (true) {
            var next = node.walk(isPrev);

            if (!next || !options.doCrossUnbreakables && !unbreakableContainer.contains(next)) {
                if (!options.doNotInsertVirtual && node.isAllowUpdate() && !node.isRoot()) {
                    var virtualText = this.params.create();
                    node[isPrev ? 'before' : 'after'](virtualText);
                    return virtualText;
                }
                return null;
            }
            if (options.stopAtBlock && next.isBlock()) {
                return next;
            }
            if (options.leafToLeaf && next.childNodes && next.childNodes.length) {
                return next._prevNextUntil(unbreakableContainer, isPrev, pred, options);
            }
            if (!pred || pred.call(next, next)) {
                return next;
            }
            node = next;
        }
    }
    /**
     * Remove to the side of the ArchNode,
     * when at its edge offset and ArchNode is a block.
     *
     * @private
     * @param {boolean} isLeft true to remove to the left
     * @returns {ArchNode} the node that will be focused after removing
     */
    _removeAtBlockEdge (isLeft) {
        var virtualText = this.params.create();
        this.parent[isLeft ? 'prepend' : 'append'](virtualText);
        var next = this.ancestor('isBlock')[isLeft ? 'previousSibling' : 'nextSibling']();
        if (next && next.isVoid()) {
            next.remove();
        }
        return virtualText.deleteEdge(isLeft);
    }
    /**
     * Remove this node's empty siblings.
     * 
     * @private
     */
    _removeEmptySiblings () {
        var prev = this.previousSibling();
        if (prev && prev.isEmpty()) {
            prev.remove();
        }
        var next = this.nextSibling();
        if (next && next.isEmpty()) {
            next.remove();
        }
    }
    /**
     * Remove to the side of the ArchNode, at given offset.
     *
     * @private
     * @param {int} offset
     * @param {boolean} isLeft true to remove to the left
     * @returns {ArchNode} the node that will be focused after removing
     */
    _removeSide (offset, isLeft) {
        if (!this.childNodes.length) {
            return this._safeRemove();
        }
        if (isLeft && offset || !isLeft && offset < this.childNodes.length) {
            var child = this.childNodes[isLeft ? offset - 1 : offset];
            return child[isLeft ? 'removeLeft' : 'removeRight'](isLeft ? child.length() : 0);
        }
        var next = this[isLeft ? 'prev' : 'next']({
            leafToLeaf: true,
            stopAtBlock: true,
        });
        if (next && next.isBlock()) {
            return this._removeAtBlockEdge(true)
        }
        return next && next[isLeft ? 'removeLeft' : 'removeRight'](isLeft ? next.length() : 0);
    }
    /**
     * Safely remove a node:
     * - put a virtual text node instead if the parent is an empty block
     * - add an extra BR if the removal would otherwise make a visible BR invisible
     *      (ie it's at the end of a block whereas it didn't use to be)
     *
     * @private
     * @returns {ArchNode|null} return a node to delete its edge (inline) after removal
     */
    _safeRemove () {
        var parent = this.parent;
        var options = {
            doNotInsertVirtual: true,
        };
        var next = this.next(options);
        var prev = this.prev(options);
        var wasPrevInvisibleBR = prev && prev.isInvisibleBR();
        this.remove();
        if (!wasPrevInvisibleBR && prev && prev.isInvisibleBR()) {
            prev.after(this.params.create('br'));
            return null;
        }
        if (parent && parent.isBlock() && parent.isEmpty()) {
            var virtualText = this.params.create();
            parent.append(virtualText);
            return virtualText;
        }
        return next || prev || parent || null;
    }
    /**
     * Add a change to the Arch on this ArchNode, at given offset.
     *
     * @private
     * @param {int} offset
     */
    _triggerChange (offset) {
        this.params.change(this, offset);
    }
    /**
     * Return the next node (if any), following a pre-order tree traversal.
     * Return null if no node was found.
     *
     * @private
     * @returns {ArchNode|null}
     */
    _walkNext () {
        if (this.childNodes && this.childNodes.length) {
            return this.firstChild();
        }
        var next = this;
        while (next.parent) {
            var parent = next.parent;
            var index = next.index();
            if (parent && parent.childNodes.length > index + 1) {
                return parent.childNodes[index + 1];
            }
            next = parent;
        }
        return null;
    }
    /**
     * Return the previous node (if any), following a pre-order tree traversal.
     * Return null if no node was found.
     *
     * @private
     * @returns {ArchNode|null}
     */
    _walkPrev () {
        var prev = this;
        if (prev.parent) {
            var parent = prev.parent;
            var index = prev.index();
            if (parent && index - 1 >= 0) {
                prev = parent.childNodes[index - 1];
                while (prev.childNodes && prev.childNodes.length) {
                    prev = prev.lastChild();
                }
                return prev;
            }
            return parent;
        }
        return null;
    }
};

})();
