(function () {
'use strict';

/*
What are the key problem that BaseRules is trying to solve?
*/

var ArchNode = we3.ArchNode;
var customArchNodes = we3.customArchNodes;
var tags = we3.tags;
var utils = we3.utils;

// Note: all rules are applied except in pre

var parserRules = [
    // [function (json) { if (test) return newJson; },
];

/**
 * Rules concerning parenting
 * 
 * @property
 * @param {Object[]} parentedRules
 * @param {Object[]} parentedRules.nodes the nodes to consider
 * @param {String[]} [parentedRules.nodes.nodeNames] ... given as list of node names
 * @param {String[]} [parentedRules.nodes.methods] ... given as list of method names to apply on arch nodes
 *              note: if several methods are given, the node has to fill ALL conditions
 *              note: if both nodeNames and methods are given, the node has to fill BOTH conditions
 * @param {Object[]} parentedRules.permittedParents the allowed direct parents for the nodes to consider
 * @param {String[]} [parentedRules.permittedParents.nodeNames] ... given as list of node names
 * @param {String[]} [parentedRules.permittedParents.methods] ... given as list of method names to apply on arch nodes
 *              note: if several methods are given, the node has to fill ALL conditions
 *              note: if both nodeNames and methods are given, the node has to fill BOTH conditions
 * @param {String[]} [parentedRules.permittedParents.defaultParentsToGenerate] (default is permittedParents.nodeNames)
 *              list representing an order for nodes to try to generate as parents of the nodes to consider if needed
 * @param {Object[]} parentedRules.forbiddenAncestors the forbidden ancestors for the nodes to consider
 * @param {String[]} [parentedRules.forbiddenAncestors.nodeNames] ... given as list of node names
 * @param {String[]} [parentedRules.forbiddenAncestors.methods] ... given as list of method names to apply on arch nodes
 * @param {String[]} [parentedRules.availableChildNodes] the allowed child nodes (use only if there is strictly no better way to express)
 */
var parentedRules = [
    {
        nodes: {
            methods: ['isBlock'],
        },
        forbiddenAncestors: {
            methods: ['isInline'],
        },
    },
    {
        nodes: {
            methods: ['isBlock'],
        },
        forbiddenAncestors: {
            nodeNames: tags.style.filter((tag) => tag !== 'td' && tag !== 'th'),
        },
    },
    {
        nodes: {
            nodeNames: ['div', 'ul', 'ol', 'table'].concat(tags.style.filter((tag) => tag !== 'td' && tag !== 'th')),
        },
        permittedParents: {
            methods: ['isRoot'],
        },
    },
    {
        nodes: {
            nodeNames: ['div'],
        },
        permittedParents: {
            nodeNames: ['div'],
        },
    },
    {
        nodes: {
            nodeNames: ['tbody', 'thead', 'tfoot'],
        },
        permittedParents: {
            nodeNames: ['table'],
        },
    },
    {
        nodes: {
            nodeNames: ['tr'],
        },
        permittedParents: {
            nodeNames: ['tbody', 'thead', 'tfoot'],
        },
    },
    {
        nodes: {
            nodeNames: ['td', 'th'],
        },
        permittedParents: {
            nodeNames: ['tr'],
        },
    },
    {
        nodes: {
            nodeNames: ['li'],
        },
        permittedParents: {
            nodeNames: ['ul', 'ol'],
        },
    },
    {
        nodes: {
            nodeNames: ['ul', 'ol'],
        },
        availableChildNodes: {
            nodeNames: ['li'],
        },
    },
    {
        nodes: {
            nodeNames: ['ul', 'ol', 'table']
                .concat(tags.style.filter((tag) => tag !== 'td' && tag !== 'th')),
        },
        permittedParents: {
            nodeNames: ['div', 'td', 'th', 'li'],
        },
    },
    // H1 > i
    // b > i
    {
        nodes: {
            nodeNames: tags.format.concat(['TEXT', 'img']),
        },
        permittedParents: {
            nodeNames: tags.style.concat(tags.format).concat(['a', 'div', 'li']),
        },
    },
    {
        nodes: {
            nodeNames: ['a'],
        },
        permittedParents: {
            nodeNames: tags.style.concat(tags.format).concat(['div', 'li']),
        },
    },
    {
        nodes: {
            nodeNames: ['a', 'button'],
        },
        forbiddenAncestors: {
            nodeNames: ['a', 'button'],
        },
    },
    {
        nodes: {
            nodeNames: ['br'],
        },
        permittedParents: {
            nodeNames: tags.style.concat(tags.format).concat(['a', 'div', 'td', 'th', 'li']),
        },
    },
];

/**
 * Order of priority for nodes (in order to get 1:1 representation)
 * Eg: if ['i', 'b'], a 'b' node can be in an 'i' node but not otherwise
 */
var orderRules = [
    ['span', 'font'].concat(tags.format.filter((tag) => tag !== 'span' && tag !== 'font')),
];


var BaseRules = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseArch'];
        this.parserRuleList = parserRules.slice();
        this.parentedRulesList = parentedRules.slice();
        this.orderRulesList = orderRules.slice();

        this._isVoidoidList = [];
        this._isUnbreakableNodeList = [];
        this._isEditableNodeList = [];

        if (this.options.parserRules) {
            this.parserRuleList.push.apply(this.parserRuleList, this.options.parserRules);
        }
        if (this.options.parentedRules) {
            this.parentedRulesList.push.apply(this.parentedRulesList, this.options.parentedRules);
        }
        if (this.options.orderRules) {
            this.orderRulesList.push.apply(this.orderRulesList, this.options.orderRules);
        }
        if (this.options.isVoidoid) {
            this._isVoidoidList.push(this.options.isVoidoid);
        }
        if (this.options.isUnbreakableNode) {
            this._isUnbreakableNodeList.push(this.options.isUnbreakableNode);
        }
        if (this.options.isEditableNode) {
            this._isEditableNodeList.push(this.options.isEditableNode);
        }
        this.currentRuleID = 0;
    }
    willStart () {
        var self = this;
        this._constructors = [];
        this._names = Object.keys(customArchNodes);
        this._names.forEach(function (name) {
            var Constructor = customArchNodes[name];
            self._constructors.push(Constructor);
            if (Constructor.parse !== ArchNode.parse) {
                Constructor.parse.__Constructor__ = Constructor;
                Constructor.parse.__type__ = name;
                self.parserRuleList.push(Constructor.parse);
            }
        });
        return super.willStart();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a method to the list to check if an ArchNode is editable.
     *
     * @see isEditable
     * @param {function(ArchNode)} fn
     */
    addEditableNodeCheck (fn) {
        if (this._isEditableNodeList.indexOf(fn) === -1) {
            this._isEditableNodeList.unshift(fn);
        }
    }
    /**
     * Add a list of ordering rules.
     *
     * @param {{} []} list
     */
    addOrderedList (list) {
        this.orderRulesList.push(list);
    }
    /**
     * Add a parser rule.
     *
     * @param {function (ArchNode, [Object])} callback
     */
    addParserRule (callback) {
        this.parserRuleList.push(callback);
    }
    /**
     * Add a structure rule.
     *
     * @param {Object} rule
     */
    addStructureRule (rule) {
        this.parentedRulesList.push(rule);
    }
    /**
     * Add a method to the list to check if an ArchNode is unbreakable.
     *
     * @see isUnbreakable
     * @param {function(ArchNode)} fn
     */
    addUnbreakableNodeCheck (fn) {
        if (this._isUnbreakableNodeList.indexOf(fn) === -1) {
            this._isUnbreakableNodeList.push(fn);
        }
    }
    /**
     * Add a method to the list to check if an ArchNode is a voidoid.
     *
     * @see isVoidoid
     * @param {Function (ArchNode)} fn
     */
    addVoidoidCheck (fn) {
        if (this._isVoidoidList.indexOf(fn) === -1) {
            this._isVoidoidList.push(fn);
        }
    }
    /**
     * Apply the rules to all the given ArchNodes.
     *
     * @param {ArchNode []} targetArchNodes
     */
    applyRules (targetArchNodes) {
        this.currentRuleID++;

        if (this._nodesUpdatedToApplyRules) {
            throw new Error("Should not apply rules twice in same time");
        }

        if (targetArchNodes instanceof ArchNode) {
            this._nodesUpdatedToApplyRules = [targetArchNodes];
        } else {
            this._nodesUpdatedToApplyRules = utils.uniq(targetArchNodes);
        }

        var alreadyTested = [];
        var alreadyTestedNumber = [];

        var nb = 0;
        while (this._nodesUpdatedToApplyRules.length) {
            this._curentTargetArchNode = this._nodesUpdatedToApplyRules.shift();
            if (this._curentTargetArchNode.__removed) {
                continue;
            }

            nb++;
            var index = alreadyTested.indexOf(this._curentTargetArchNode);
            if (index === -1) {
                alreadyTested.push(this._curentTargetArchNode);
                alreadyTestedNumber.push(1);
            } else {
                alreadyTestedNumber[index]++;
            }
            if (alreadyTestedNumber[index] > 10) {
                console.error('This archNode has already been tested 10 times.', this._curentTargetArchNode);
                continue;
            }

            this._applyRulesOnArchNode(this._curentTargetArchNode);
        }

        this._nodesUpdatedToApplyRules = null;
    }
    /**
     * Update the list of archNodes to apply the rules onto.
     *
     * @param {ArchNode} archNode
     * @param {int} offset
     */
    changeArchTriggered (archNode, offset) {
        if (!this._nodesUpdatedToApplyRules || archNode.__removed || this.__preventChangeForGeneratedParentTesting) {
            return;
        }
        var target = archNode.childNodes && archNode.childNodes[offset];
        if (target && this._nodesUpdatedToApplyRules.indexOf(archNode.childNodes[offset]) === -1) {
            this._nodesUpdatedToApplyRules.push(target);
        }
        if (this._nodesUpdatedToApplyRules.indexOf(archNode) === -1) {
            this._nodesUpdatedToApplyRules.push(archNode);
        }
    }
    /**
     * Return true if the current node is editable (for keypress and selection).
     *
     * @param {ArchNode} archNode
     * @returns {Boolean|undefined}
     */
    isEditableNode (archNode) {
        for (var i = 0; i < this._isEditableNodeList.length; i++) {
            var res = this._isEditableNodeList[i](archNode, this.options);
            if (res) {
                return true;
            }
            if (res === false) {
                return false;
            }
        }
        return undefined;
    }
    /**
     * Return true if the given ArchNode is unbreakable.
     * An unbreakable node can be removed or added but can't by split into
     * different nodes (for keypress and selection).
     * An unbreakable node can contain nodes that can be edited.
     *
     * @param {ArchNode} archNode
     * @returns {Boolean}
     */
    isUnbreakableNode (archNode) {
        for (var i = 0; i < this._isUnbreakableNodeList.length; i++) {
            var res = this._isUnbreakableNodeList[i](archNode, this.options);
            if (res) {
                return true;
            }
        }
        return false;
    }
    /**
     * Return true if the node is a set to be treated like a void node, ie
     * the cursor can not be placed inside it.
     * The conditions can be extended by plugins by adding a method with
     * `addVoidoidCheck`. If any of the methods returns true, this will too.
     *
     * @param {ArchNode} archNode
     * @returns {Boolean}
     */
    isVoidoid (archNode) {
        for (var i = 0; i < this._isVoidoidList.length; i++) {
            if (this._isVoidoidList[i](archNode, this.options)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Parse an ArchNode and apply the parser rules onto it.
     *
     * @param {ArchNode} archNode
     * @param {Boolean} preventPropagation true to prevent the propagation of the rules
     */
    parse (archNode, preventPropagation) {
        var self = this;
        var BaseArch = this.dependencies.BaseArch;
        for (var k = 0, len = this.parserRuleList.length; k < len ; k++) {
            var ruleMethod = this.parserRuleList[k];
            if (ruleMethod.__Constructor__ && (ruleMethod.__Constructor__ === archNode.constructor || ruleMethod.__type__ === archNode.type)) {
                continue;
            }
            var newNode = ruleMethod(archNode, self.options);
            if (newNode) {
                var __ruleParser__ = archNode.__ruleParser__ || [];
                var type = this._names[this._constructors.indexOf(newNode.constructor)] || newNode.type;

                if (__ruleParser__.indexOf(type) !== -1) {
                    console.warn("Can't choose the type of ArchNode", __ruleParser__);
                    return archNode;
                }

                if (!(newNode instanceof ArchNode)) {
                    newNode = BaseArch.parse(newNode);
                }

                __ruleParser__.push(type);
                newNode.__ruleParser__ = __ruleParser__;

                if (archNode.parent) {
                    archNode.before(newNode);
                    archNode.remove();
                }
                return this.parse(newNode);
            }
        }

        if (!preventPropagation && archNode.childNodes) {
            var childNodes = [].slice.call(archNode.childNodes);
            childNodes.forEach(this.parse.bind(this));
        }
        return archNode;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Find the method names on the given ArchNodes and
     * return true if they all return true.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {string []} methods
     * @returns {Boolean}
     */
    _allMethodsPass (targetArchNode, methods) {
        return methods.every((methodName) => targetArchNode[methodName] && targetArchNode[methodName]());
    }
    /**
     * Apply the parented rules on the given ArchNode.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @returns {Boolean} true if nothing happened
     */
    _applyRulesCheckParents (targetArchNode) {
        if (!targetArchNode.parent) {
            return true;
        }
        this._applyRulesToRemoveForbiddenNodes(targetArchNode);
        if (targetArchNode.__removed) {
            return true;
        }
        var path = this._getParentGenerationPath(targetArchNode);
        this._applyRulesGenerateAncestors(targetArchNode, path);
        return false;
    }
    /**
     * Filter the given rules to return only the ones that are relevant
     * to the given ArchNode.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {Object []} rules
     * @returns {Object []}
     */
    _applyRulesFilterRules (targetArchNode, rules) {
        var self = this;
        var selectedRules = [];
        rules.forEach(function (rule) {
            var nodeNames = rule.nodes.nodeNames || [];
            var methods = rule.nodes.methods || [];
            if (nodeNames.length) {
                nodeNames.some(function (nodeName) {
                    if (targetArchNode.nodeName === nodeName || targetArchNode.type === nodeName) {
                        if (self._allMethodsPass(targetArchNode, methods)) {
                            selectedRules.push(rule);
                        }
                        return true;
                    }
                });
            } else if (self._allMethodsPass(targetArchNode, methods)) {
                selectedRules.push(rule);
            }
        });
        return selectedRules;
    }
    /**
     * Generate ancestors for `targetArchNode`, following the parented rules.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {string []} path list of nodeNames to generate, from lower to higher ancestor
     */
    _applyRulesGenerateAncestors (targetArchNode, path) {
        if (!path.length || path[0] === 'EDITABLE') {
            return;
        }
        var newAncestor = this.dependencies.BaseArch.createArchNode(path.pop());
        var lastParent = newAncestor;
        while (path.length) {
            var node = this.dependencies.BaseArch.createArchNode(path.pop());
            lastParent.append(node);
            lastParent = node;
        }

        targetArchNode.parent.insertBefore(newAncestor, targetArchNode);
        lastParent.append(targetArchNode);
        newAncestor.__applyRulesCheckParentsFlag = this.currentRuleID;
        // merge generated parents if needed
        var prev = newAncestor.previousSibling();
        if (prev && prev.__applyRulesCheckParentsFlag === this.currentRuleID) {
            if (targetArchNode.isPlaceholderBR()) {
                targetArchNode.after(this.dependencies.BaseArch.createArchNode('br'));
            }
            newAncestor.deleteEdge(true, {
                doNotRemoveEmpty: true,
                mergeOnlyIfSameType: true,
            });
        }
        // this._applyRulesOnArchNode(newAncestor);
    }
    /**
     * Merge excess structure around `targetArchNode`
     * after applying rules altered the Arch.
     *
     * @private
     * @param {ArchNode} targetArchNode
     */
    _applyRulesMergeExcessStructure (targetArchNode) {
        var self = this;
        if (!targetArchNode.childNodes) {
            return;
        }
        for (var k = targetArchNode.childNodes.length - 1; k >= 0; k--) {
            var item = targetArchNode.childNodes[k];

            if (!isGeneratedParent(item)) {
                continue;
            }

            var prev = item.previousSibling(visibleNode);
            if (prev && prev.nodeName === item.nodeName && isGeneratedParent(prev) && item.attributes.toString() === prev.attributes.toString()) {
                item.childNodes.slice().forEach(function (node) {
                    prev.append(node);
                });
                item.remove();
                continue;
            }

            var next = item.previousSibling(visibleNode);
            if (next && next.nodeName === item.nodeName && isGeneratedParent(next) && item.attributes.toString() === next.attributes.toString()) {
                item.childNodes.slice().forEach(function (node) {
                    next.append(node);
                });
                item.remove();
            }
        };

        function isGeneratedParent (n) {
            return n.__applyRulesCheckParentsFlag === self.currentRuleID;
        }
        function visibleNode (n) {
            return !(n.isText() && n.isVirtual()) && !n.isArchitecturalSpace();
        }
    }
    /**
     * Apply all the rules on the given ArchNode.
     *
     * @private
     * @param {ArchNode} targetArchNode
     */
    _applyRulesOnArchNode (targetArchNode) {
        if (!targetArchNode.isAllowUpdate()) {
            return;
        }
        if (targetArchNode.isRoot()) {
            this._applyRulesMergeExcessStructure(targetArchNode);
            return;
        }
        this.parse(targetArchNode, true);
        if (!targetArchNode.__removed) {
            targetArchNode._applyRulesArchNode();
        }
        if (!targetArchNode.__removed) {
            this._applyRulesOrder(targetArchNode);
        }
        if (!targetArchNode.__removed) {
            this._applyRulesCheckParents(targetArchNode);
        }
        if (!targetArchNode.__removed) {
            this._applyRulesMergeExcessStructure(targetArchNode);
        }
    }
    /**
     * Apply the order rules on the given ArchNode.
     *
     * @see orderRulesList
     * @private
     * @param {ArchNode} targetArchNode
     */
    _applyRulesOrder (targetArchNode) {
        var rules = this.orderRulesList.flat();
        var pos = rules.indexOf(targetArchNode.nodeName);
        if (pos === -1 || !targetArchNode.isAllowUpdate() || targetArchNode.isUnbreakable()) {
            return;
        }
        var disorderedAncestors = [];
        var toUnwrap = [];
        var node = targetArchNode;
        while (node && node.parent && !node.isRoot()) {
            var parentPos = rules.indexOf(node.parent.nodeName);
            if (node.parent.nodeName === targetArchNode.nodeName) {
                toUnwrap.push(node);
            }
            if (parentPos > pos && node.parent.isAllowUpdate() && !node.parent.isUnbreakable()) {
                disorderedAncestors.push(node);
            }
            node = node.parent;
        }
        disorderedAncestors.forEach((ancestor) => this._swapWithParent(ancestor));
        toUnwrap.forEach((node) => node.unwrap());
    }
    /**
     * Apply the parented rules regarding forbidden ancestry on the given ArchNode.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @returns {Boolean}
     */
    _applyRulesToRemoveForbiddenNodes (targetArchNode) {
        var parentedRules = this._applyRulesFilterRules(targetArchNode, this.parentedRulesList);
        if (this._hasForbiddenParentNode(targetArchNode, parentedRules)) {
            targetArchNode.childNodes.forEach((node) => node.unwrap());
            return true;
        }
        return false;
    }
    /**
     * Return the list of permitted parents for `targetArchNode`, if one must be generated.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {Object []} parentedRules
     * @returns {string []}
     */
    _getParentCandidates (targetArchNode, parentedRules) {
        var availableCandidates = [];
        for (var i = 0; i < parentedRules.length; i++) {
            var rule = parentedRules[i];
            if (!rule.permittedParents) {
                continue;
            }
            var allowNodes = rule.permittedParents && rule.permittedParents.nodeNames || [];
            var allowMethods = rule.permittedParents && rule.permittedParents.methods || [];
            var defaultParents = rule.permittedParents && rule.permittedParents.defaultParentsToGenerate || [];
            if (this._mustGenerateParent(allowNodes, allowMethods, targetArchNode.parent)) {
                availableCandidates = availableCandidates.concat(allowNodes.length && allowNodes || defaultParents);
            } else {
                return [];
            }
        }
        if (targetArchNode.parent) {
            this._applyRulesFilterRules(targetArchNode.parent, this.parentedRulesList).forEach(function (rule) {
                if (rule.availableChildNodes && rule.availableChildNodes.nodeNames) {
                    availableCandidates = availableCandidates.filter(nodeName => rule.availableChildNodes.nodeNames.indexOf(nodeName) !== -1);
                    rule.availableChildNodes.nodeNames.forEach(function (nodeName) {
                        if (availableCandidates.indexOf(nodeName) === -1) {
                            availableCandidates.push(nodeName);
                        }
                    });
                }
            });
        }
        return availableCandidates;
    }
    /**
     * Return the shortest parent generation path for `targetArchNode`
     * so its ancestry is valid.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @returns {string []}
     */
    _getParentGenerationPath (targetArchNode) {
        var res = {
            allPath: [[]],
            best: null,
            tested: {},
        };
        this._getParentGenerationPathRecursive(targetArchNode, res.allPath[0], res);
        return res.best ? res.best.slice(0, -1) : [];
    }
    /**
     * Recursive helper to `_getParentGenerationPath`.
     *
     * @see _getParentGenerationPath
     * @private
     * @param {ArchNode} targetArchNode
     * @param {string []} currentPath
     * @param {string []} res
     * @returns {Boolean} true if the path is valid
     */
    _getParentGenerationPathRecursive (targetArchNode, currentPath, res) {
        var parentedRules = this._applyRulesFilterRules(targetArchNode, this.parentedRulesList);

        var forbiddenParent = this._hasForbiddenParentNode(targetArchNode, parentedRules);
        if (forbiddenParent) {
            currentPath.push(false);
            return;
        }

        var candidates = this._getParentCandidates(targetArchNode, parentedRules);
        if (!candidates.length) {
            var isValid = this._isPermittedChildNode(targetArchNode);
            currentPath.push(isValid);
            if (isValid && (!res.best || currentPath.length < res.best.length)) {
                res.best = currentPath;
            }
            return isValid;
        }

        if (res.best && res.best.length <= currentPath.length) {
            currentPath.push(null);
            return;
        }

        var alreadyFoundValidNextLevel = false;

        for (var i = 0; i < candidates.length; i++) {
            var candidate = candidates[i];
            if ((candidate in res.tested) && res.tested[candidate] <= currentPath.length) {
                continue;
            }
            res.tested[candidate] = currentPath.length;
            if (candidate === targetArchNode.parent.nodeName || candidate === targetArchNode.parent.type) {
                currentPath.push(true); // mark the path as finished and is valid
                if (isValid && (!res.best || currentPath.length < res.best.length)) {
                    res.best = currentPath;
                }
                return true;
            }
            if (candidate === 'EDITABLE') {
                continue;
            }

            var newPath = currentPath.concat([candidate]);
            res.allPath.push(newPath);

            if (alreadyFoundValidNextLevel) {
                newPath.push(false);
                continue;
            }

            // generate parent and test it

            this.__preventChangeForGeneratedParentTesting = true;
            var parent = targetArchNode.parent;
            var newAncestor = this.dependencies.BaseArch.createArchNode(candidate);
            newAncestor.__applyRulesCheckParentsFlag = this.currentRuleID;
            this.dependencies.BaseArch.bypassUpdateConstraints(function () {
                parent.insertBefore(newAncestor, targetArchNode);
                newAncestor.append(targetArchNode);
            });
            this.__preventChangeForGeneratedParentTesting = false;

            if (this._getParentGenerationPathRecursive(newAncestor, newPath, res)) {
                alreadyFoundValidNextLevel = true;
            }

            this.__preventChangeForGeneratedParentTesting = true;
            this.dependencies.BaseArch.bypassUpdateConstraints(function () {
                parent.insertBefore(targetArchNode, newAncestor);
                newAncestor.remove();
            });
            this.__preventChangeForGeneratedParentTesting = false;
        }

        currentPath.push(null);
    }
    /**
     * Return true if the given ArchNode has a forbidden ancestor.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {Object []} parentedRules
     * @returns {Boolean}
     */
    _hasForbiddenParentNode (targetArchNode, parentedRules) {
        var self = this;
        var forbiddenParent = false;
        for (var i = 0; i < parentedRules.length; i++) {
            var rule = parentedRules[i];
            if (!rule.forbiddenAncestors) {
                continue;
            }
            var forbidNodes = rule.forbiddenAncestors && rule.forbiddenAncestors.nodeNames || [];
            var forbidMethods = rule.forbiddenAncestors && rule.forbiddenAncestors.methods || [];

            if (forbidNodes.length) {
                targetArchNode.ancestor(function (ancestor) {
                    if (ancestor.id !== targetArchNode.id && forbidNodes.indexOf(ancestor.nodeName) !== -1 && self._allMethodsPass(ancestor, forbidMethods)) {
                        forbiddenParent = ancestor;
                        return true;
                    }
                });
            } else if (forbidMethods.length) {
                targetArchNode.ancestor(function (ancestor) {
                    if (ancestor.id !== targetArchNode.id && self._allMethodsPass(ancestor, forbidMethods)) {
                        forbiddenParent = ancestor;
                        return true;
                    }
                });
            }
        }
        return !!forbiddenParent;
    }
    /**
     * Return true if the given ArchNode is one of the permitted children of its parent.
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @returns {Boolean}
     */
    _isPermittedChildNode (targetArchNode) {
        var childNodesRules = this._applyRulesFilterRules(targetArchNode.parent, this.parentedRulesList);
        for (var i = 0; i < childNodesRules.length; i++) {
            var rule = childNodesRules[i];
            if (rule.availableChildNodes && rule.availableChildNodes.nodeNames && rule.availableChildNodes.nodeNames.indexOf(targetArchNode.nodeName) === -1 && rule.availableChildNodes.nodeNames.indexOf(targetArchNode.type) === -1) {
                return false;
            }
            if (rule.availableChildNodes && rule.availableChildNodes.methods && !this._allMethodsPass(targetArchNode, rule.availableChildNodes.methods)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Return true if `parent` is an invalid parent to its child.
     *
     * @private
     * @param {string []} allowNodes
     * @param {string []} allowMethods
     * @param {ArchNode} parent
     * @returns {Boolean}
     */
    _mustGenerateParent (allowNodes, allowMethods, parent) {
        var isParentOK = true;
        var parentName = parent.isRoot() || parent.nodeName === 'FRAGMENT' ? 'EDITABLE' : parent.nodeName;
        if (allowNodes.length) {
            isParentOK = allowNodes.indexOf(parentName) !== -1 && (!allowMethods.length || this._allMethodsPass(parent, allowMethods));
        } else if (allowMethods.length) {
            isParentOK = this._allMethodsPass(parent, allowMethods);
        }
        return !isParentOK;
    }
    /**
     * Split a `node`'s `ancestor` at the edges of its first direct child that is an
     * ancestor of `node`, then clean up (remove empty nodes, delete edge).
     *
     * @private
     * @param {ArchNode} targetArchNode
     * @param {ArchNode} ancestor
     * @param {Boolean} isLeftEdge true to split at left edge, false for right edge
     */
    _splitAncestorAtEdgeOf (targetArchNode, ancestor, isLeftEdge) {
        var offset = targetArchNode.ancestor((a) => a.parent && a.parent.id === ancestor.id).index();
        offset = isLeftEdge ? offset : offset + 1;
        var next = ancestor.split(offset);
        var toClean = isLeftEdge ? next && next.previousSibling() : next;
        if (!toClean) {
            return;
        }
        if (toClean.isEmpty()) {
            toClean.remove();
        } else {
            toClean.deleteEdge(!isLeftEdge, {
                doNotBreakBlocks: true,
                mergeOnlyIfSameType: true,
            });
        }
    }
    /**
     * Swap a node with its parent.
     * eg: `<i><b>text</b></i> and targetArchNode == b => <b><i>text</i></b>`
     *
     * @private
     * @param {ArchNode} targetArchNode
     */
    _swapWithParent (targetArchNode) {
        if (targetArchNode.__removed) {
            return;
        }
        var parent = targetArchNode.parent;
        var next = parent.split(targetArchNode.index());
        var nextNext = next.split(1);
        next.before(targetArchNode);
        var fragment = targetArchNode._fragmentWithChildren(targetArchNode.childNodes);
        next.append(fragment);
        targetArchNode.append(next);
        parent.removeIfEmpty(true);
        next.removeIfEmpty(true);
        nextNext.removeIfEmpty(true);
    }
};

we3.pluginsRegistry.BaseRules = BaseRules;

})();
