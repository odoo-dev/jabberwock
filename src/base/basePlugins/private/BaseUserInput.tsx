(function () {
'use strict';

/*
What are the key problem that BaseUserInput is trying to solve?

- normalization of inputs
*/

var BaseUserInput = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return [];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseArch', 'BaseRange', 'BaseRenderer', 'UserInput'];
        this.editableDomEvents = {
            keydown: '_onKeyDown',
            keypress: '_onKeyDown',
            input: '_onInput',
            compositionend: '_onCompositionEnd',
            mousedown: '_onMousedDown',
            touchstart: '_onMousedDown',
        };
        var self = this;
        this.documentDomEvents = {
            selectionchange: '_onSelectionChange',
            mousedown: '_onMousedActivity',
            mousemove: '_onMousedActivity',
            click: '_onMousedActivity',
            mouseup: '_onMousedActivity',
        };
        this._mouseActivity = 0;
    }
    willStart () {
        var self = this;
        this._observer = new MutationObserver(function onMutation (mutationsList, observer) {
            if (self._currentEvent) {
                self._currentEvent.mutationsList = self._currentEvent.mutationsList.concat(mutationsList);
            }
        });
        this._observer.observe(this.editable, {
            characterData: true,
            childList: true,
            subtree: true,
        });
        return super.willStart();
    }
    blurEditor () {
        this._editorFocused = false;
    }
    focusEditor () {
        this._editorFocused = true;
    }
    destroy () {
        this._observer.disconnect();
        super.destroy();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Add a newline at range: split a paragraph if possible, after
     * removing the selection if needed.
     */
    _addLine () {
        var self = this;
        return this.dependencies.BaseArch.do(function () {
            var range = self.dependencies.BaseRange.getRange();
            var id, offset;
            if (range.isCollapsed()) {
                id = range.scID;
                offset = range.so;
            } else {
                id = self.dependencies.BaseArch.removeFromRange().id;
                offset = 0;
            }
            self.dependencies.BaseArch.nextChangeIsRange();
            self.dependencies.BaseArch.getArchNode(id).addLine(offset);
        });
    }
    _eventsNormalization (param) {
        var ev = {
            preventDefault: function () {
                param.defaultPrevented = true;
            },
            get defaultPrevented () {
                return param.defaultPrevented;
            }
        };

        if (param.defaultPrevented) {
            // nothing
        } else if (param.type === 'selectAll') {
            ev.name = 'selectAll';
        } else if (param.type === 'composition') {
            ev.data = param.data;
            // previous.update = audroid update for each char
            // param.data[0] !== ' ' = audio insertion
            ev.previous = param.data[0] !== ' ' && param.previous && param.previous.update ? param.previous.data : false;
            ev.name = 'composition';
            return ev;
        } else {
            ev.shiftKey = param.shiftKey;
            ev.ctrlKey = param.ctrlKey;
            ev.altKey = param.altKey;
            if (param.key === 'Backspace') {
                ev.name = 'Backspace';
                return ev;
            } else if (param.key === 'Delete') {
                ev.name = 'Delete';
                return ev;
            } else if (param.key === 'Tab') {
                ev.name = 'Tab';
                return ev;
            } else if (param.key === 'Enter') {
                ev.name = 'Enter';
                return ev;
            } else if ((!param.ctrlKey && !param.altKey || param.inputType === 'insertText') &&
                    (param.data && param.data.length === 1 || param.key && param.key.length === 1 || param.key === 'Space')) {
                ev.data = param.data && param.data.length === 1 ? param.data : param.key;
                if (param.data === 'Space') {
                    param.data = ' ';
                }
                ev.name = 'char';
                return ev;
            }
        }

        ev = Object.assign({
            preventDefault: ev.preventDefault,
        }, param);
        ev.name = 'default';
        return ev;
    }
    _eventsdDspatcher (ev, param) {
        if (ev.name === 'composition') {
            return this._pressInsertComposition(ev);
        } else if (ev.name === 'Backspace') {
            return this._removeSide(true);
        } else if (ev.name === 'Delete') {
            return this._removeSide(false);
        } else if (ev.name === 'Tab') {
            return this._pressInsertTab(ev);
        } else if (ev.name === 'Enter') {
            return this._pressInsertEnter(ev);
        } else if (ev.name === 'char') {
            return this._pressInsertChar(ev);
        }
    }
    _findOffsetInsertion (text, offset, insert) {
        var prevIndex = offset;
        var globalIndex = 0;
        do {
            var index = text.substring(globalIndex).indexOf(insert);
            if (index === -1) {
                break;
            }
            index += globalIndex;
            globalIndex = index + 1;

            if (prevIndex >= index && prevIndex <= index + insert.length) {
                return index + insert.length;
            }
        } while (globalIndex < text.length);

        return -1;
    }
    _isOffsetLeftEdge (range) {
        var pointArch = this._skipVirtual({
            archNode: range.scArch,
            offset: range.so,
        });
        return !pointArch.offset && range.isCollapsed() && pointArch.archNode
    }
    _isOnLeftEdgeOf (ancestorOrMethodName, range) {
        var ancestor = typeof ancestorOrMethodName === 'string' ? range.scArch.ancestor(ancestorOrMethodName) : ancestorOrMethodName;
        return ancestor && range.scArch.isLeftEdgeOf(ancestor, true) && this._isOffsetLeftEdge(range);
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertChar (param) {
        if (param.data === ' ') {
            return this.dependencies.BaseArch.insert(this.utils.char('nbsp'));
        } else if (param.data.charCodeAt(0) === 10) {
            return this.dependencies.BaseArch.insert('<br/>');
        } else {
            return this.dependencies.BaseArch.insert(param.data);
        }
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertComposition (param) {
        var self = this;
        var BaseArch = this.dependencies.BaseArch;
        var BaseRenderer = this.dependencies.BaseRenderer;
        var BaseRange = this.dependencies.BaseRange;

        return BaseArch.do(function () {
            var range = BaseRange.getRange();
            var archNode = BaseArch.getArchNode(range.scID);
            var arch = archNode.ancestor('isFormatNode') || archNode.ancestor('isUnbreakable');
            var formatNode = BaseRenderer.getElement(arch.id);

            if (!formatNode) {
                return;
            }

            var lastTextNodeID;
            var lastTextNodeOldValue;
            var newArch = BaseArch.parse(formatNode.cloneNode(true));
            newArch.nextUntil(function (archNode) {
                if (!archNode.isText()) {
                    return;
                }
                var target = arch.applyPath(archNode.path(newArch));
                if (target && target.isText()) {
                    lastTextNodeOldValue = target.nodeValue;
                    lastTextNodeID = target.id;

                    if (range.scID === lastTextNodeID && param.previous) {
                        // eg: 'paaa' from replacement of 'a' in 'aa' ==> must be 'paa'
                        var previous = param.previous ? param.previous.replace(/\u00A0/g, ' ') : '';
                        var beforeRange = lastTextNodeOldValue.replace(/\u00A0/g, ' ').slice(0, range.so);
                        var afterRange = lastTextNodeOldValue.replace(/\u00A0/g, ' ').slice(range.so);
                        if (previous && beforeRange.slice(-previous.length) === previous) {
                            beforeRange = beforeRange.slice(0, -previous.length);
                        }
                        archNode.nodeValue = beforeRange + param.data + afterRange;
                    }

                    target.setNodeValue(archNode.nodeValue);
                } else if (target && target.isBR()) {
                    var res = target.insert(archNode.params.create(null, null, archNode.nodeValue));
                    lastTextNodeOldValue = archNode.nodeValue;
                    lastTextNodeID = res[0] && res[0].id;
                }
            }, {doNotLeaveNode: true});

            if (lastTextNodeID) {
                var archNode = BaseArch.getArchNode(lastTextNodeID);
                var lastTextNodeNewValue = archNode.nodeValue.replace(/\u00A0/g, ' ');
                var newOffset = lastTextNodeNewValue.length;

                param.data = param.data.replace(/\u00A0/g, ' ');
                if (lastTextNodeID === range.scID) {
                    var offset = 0;
                    if (lastTextNodeID === range.scID) {
                        offset = range.so;
                        if (lastTextNodeOldValue.length > lastTextNodeNewValue.length) {
                            offset -= lastTextNodeOldValue.length - lastTextNodeNewValue.length;
                            if (offset < 0) {
                                offset = 0;
                            }
                        }
                    }

                    var newOffset = self._findOffsetInsertion(lastTextNodeNewValue, offset, param.data);
                    newOffset = newOffset !== -1 ? newOffset : offset;

                    if (lastTextNodeNewValue[newOffset] === ' ') {
                        newOffset++;
                    }
                }

                newOffset = Math.min(newOffset, archNode.nodeValue.length);
                return {
                    scID: lastTextNodeID,
                    so: newOffset,
                };
            }

            var lastLeaf = formatNode.lastLeaf();
            if (lastLeaf) {
                return {
                    scID: lastLeaf.id,
                    so: lastLeaf.length(),
                };
            }

            var rangeDOM = BaseRange.getRangeFromDOM();
            if (rangeDOM && rangeDOM.scID && rangeDOM.scArch.length() <= rangeDOM.so) {
                return {
                    scID: rangeDOM.scID,
                    so: rangeDOM.so,
                };
            }
        });
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertEnter (param) {
        var BaseArch = this.dependencies.BaseArch;
        var BaseRange = this.dependencies.BaseRange;

        if (param.shiftKey) {
            return BaseArch.insert('<br/>');
        } else {
            var range = BaseRange.getRange();
            var liAncestor = range.scArch.ancestor('isLi');
            var isInEmptyLi = range.isCollapsed() && liAncestor && liAncestor.isDeepEmpty();
            if (isInEmptyLi) {
                return BaseArch.outdent();
            } else {
                return this._addLine();
            }
        }
    }
    /**
     * Insert a TAB (4 non-breakable spaces).
     *
     * @private
     * @param {object} param
     */
    _pressInsertTab (param) {
        if (this.options.tab && !this.options.tab.enabled) {
            return;
        }
        if (param.shiftKey || param.ctrlKey || param.altKey) {
            return;
        }
        var tabSize = this.options.tab && this.options.tab.size || 0;
        var tab = new Array(tabSize).fill(this.utils.char('nbsp')).join('');
        return this.dependencies.BaseArch.insert(tab);
    }
    _redrawToRemoveArtefact (mutationsList) {
        var BaseRenderer = this.dependencies.BaseRenderer;
        var BaseRange = this.dependencies.BaseRange;

        // mark as dirty the new nodes to re-render it
        // because the browser can split other than our arch and we must fix the errors
        var targets = [];
        mutationsList.forEach(function (mutation) {
            if (mutation.type == 'characterData' && targets.indexOf(mutation.target) === -1) {
                targets.push(mutation.target);
            }
            if (mutation.type == 'childList') {
                mutation.addedNodes.forEach(function (target) {
                    if (targets.indexOf(target) === -1) {
                        targets.push(target);
                    }
                });
                mutation.removedNodes.forEach(function (target) {
                    if (targets.indexOf(target) === -1) {
                        targets.push(target);
                    }
                });
            }
        });

        targets.forEach(function (target) {
            var id = BaseRenderer.getID(target);
            if (id) {
                BaseRenderer.markAsDirty(id, {childNodes: true, nodeValue: true});
            } else if (target.parentNode) {
                target.parentNode.removeChild(target);
            }
        });

        if (targets.length) {
            BaseRenderer.redraw({forceDirty: false});
            BaseRange.restore();
        }
    }
    _skipVirtual (pointArch) {
        if (pointArch.archNode.isVirtual()) {
            pointArch.archNode = pointArch.archNode.nextUntil(pointArch.archNode.isNotVirtual);
            pointArch.offset = 0;
        }
        return pointArch;
    }
    /**
     * Select all the contents of the current unbreakable ancestor.
     */
    _selectAll () {
        var self = this;
        var range = this.dependencies.BaseRange.getRange();
        var unbreakable = range.scArch.ancestor('isUnbreakableNode');
        var $contents = $(unbreakable).contents();
        var startNode = $contents.length ? $contents[0] : unbreakable;
        var pointA = this.getPoint(startNode, 0);
        pointA = pointA.nextUntil(function (point) {
            return self.utils.isVisibleText(point.node);
        });
        var endNode = $contents.length ? $contents[$contents.length - 1] : unbreakable;
        var endOffset = $contents.length ? this.utils.nodeLength($contents[$contents.length - 1]) : 1;
        var pointB = this.getPoint(endNode, endOffset);
        pointB = pointB.prevUntil(function (point) {
            return self.utils.isVisibleText(point.node);
        });
        if (pointA && pointB) {
            range.replace({
                sc: pointA.node,
                so: pointA.offset,
                ec: pointB.node,
                eo: pointB.offset,
            }).normalize();
            range = this.dependencies.BaseArch.setRange(range.getPoints());
            this.dependencies.BaseArch.setRange(range);
        }
    }
    /**
     * Remove to the side of the current range.
     *
     * @private
     * @param {Boolean} isLeft true to remove to the left
     */
    _removeSide (isLeft) {
        var self = this;
        return this.dependencies.BaseArch.do(function () {
            var range = self.dependencies.BaseRange.getRange();
            if (range.isCollapsed()) {
                var offset = range.so;
                var node = self.dependencies.BaseArch.getArchNode(range.scID);
                var next = node[isLeft ? 'removeLeft' : 'removeRight'](offset);
                if (next) {
                    next.lastLeaf().deleteEdge(true, {
                        doNotBreakBlocks: true,
                    });
                }
             } else {
                var virtualText = self.dependencies.BaseArch.removeFromRange();
                virtualText.parent.deleteEdge(false,  {
                    keepRight: true,
                });
            }
        });
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onCompositionEnd (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        var param = this._onKeyDownNextTick(e);
        param.type = 'composition';
        param.update = false;
        param.data = e.data;
    }
    _onInput (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        var param = this._onKeyDownNextTick(e);

        if (!param.type) {
            param.type = e.type;
            param.data = e.data;
        }

        // todo: delete word <=> composition

        if (e.inputType === 'insertCompositionText' || e.inputType === 'insertReplacementText') {
            param.update = param.update || param.type !== 'composition';
            param.type = 'composition';
            param.data = e.data;
        } else if (e.inputType === 'insertParagraph' && param.key === 'Unidentified') {
            param.key = 'Enter';
        } else if (e.inputType === 'deleteContentBackward' && param.key === 'Unidentified') {
            param.key = 'Backspace';
        } else if (e.inputType === 'deleteContentForward' && param.key === 'Unidentified') {
            param.key = 'Delete';
        } else if (!param.data) {
            param.data = e.data;
        } else if (e.inputType === "insertText") {
            if (param.type.indexOf('key') === 0 && param.key.length === 1 && e.data.length === 1) {
                param.key = e.data; // keep accent
            } else if(e.data && e.data.length === 1 && e.data !== param.data && param.type === 'composition') {
                // swiftKey add automatically a space after the composition, without this line the arch is correct but not the range
                param.data += e.data;
            } else if (param.key === 'Unidentified') {
                param.key = e.data;
            }
        }
    }
    _onKeyDown (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        if (e.type === 'keydown' && e.key === 'Dead') {
            return;
        }
        if (e.key === 'End' || e.key === 'Home' || e.key === 'PageUp' || e.key === 'PageDown' || e.key.indexOf('Arrow') === 0) {
            return;
        }
        var param = this._onKeyDownNextTick(e);
        param.defaultPrevented = param.defaultPrevented || e.defaultPrevented;
        param.type = param.type || e.type;
        param.shiftKey = e.shiftKey;
        param.ctrlKey = e.ctrlKey;
        param.altKey = e.altKey;
        param.key = e.key;
    }
    _onKeyDownNextTick (e) {
        if (this._currentEvent) {
            this._currentEvent.events.push(e);
            return this._currentEvent;
        }
        this._currentEvent = {
            type: null,
            key: 'Unidentified',
            data: '',
            shiftKey: false,
            ctrlKey: false,
            mutationsList: [],
            defaultPrevented: false,
            events: [e],
        };
        setTimeout(this.__onKeyDownNextTick.bind(this));
        return this._currentEvent;
    }
    _onMousedDown () {
        this._previousEvent = null;
    }
    _onMousedActivity (e) {
        if (e.detail === 0 || !this._editorFocused || this.editable !== e.target && !this.editable.contains(e.target)) {
            return;
        }
        var self = this;
        this._mouseActivity++;
        setTimeout(function () {
            self._mouseActivity--;
        });
    }
    async __onKeyDownNextTick () {
        var UserInput = this.dependencies.UserInput;
        var param = this._currentEvent;
        param.previous = this._previousEvent;
        this._previousEvent = param;
        this._currentEvent = null;

        var ev = this._eventsNormalization(param);
        if (!ev.defaultPrevented) {
            UserInput.trigger(ev.name, ev);
        }
        if (!ev.defaultPrevented) {
            await this._eventsdDspatcher(ev, param);
        }

        this._redrawToRemoveArtefact(param.mutationsList);
    }
    _onSelectionChange (e) {
        if (!this._editorFocused || this._mouseActivity || this.editable.style.display === 'none') {
            return;
        }

        var UserInput = this.dependencies.UserInput;
        var range = this.dependencies.BaseRange.getRange();
        var rangeDOM = this.dependencies.BaseRange.getRangeFromDOM();
        if (range.sc === rangeDOM.sc && range.so === rangeDOM.so &&
            range.ec === rangeDOM.ec && range.eo === rangeDOM.eo) {
            return;
        }

        if (rangeDOM.isCollapsed() || !rangeDOM.sc || !rangeDOM.ec) {
            return;
        }
        if (!this.document.body.contains(rangeDOM.sc) || !this.document.body.contains(rangeDOM.ec)) {
            return;
        }
        if (rangeDOM.so !== 0 && rangeDOM.sc.nodeType === 3 || rangeDOM.ec.nodeType === 3 && rangeDOM.eo !== rangeDOM.ec.textContent.length) {
            return;
        }

        function isVisible (el) {
            if (el.tagName === 'WE3-EDITABLE') {
                return true;
            }
            var style = window.getComputedStyle(el.parentNode);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
            return isVisible(el.parentNode);
        }

        var el;
        if (this.editable.contains(rangeDOM.sc)) {
            el = this.editable;
            while (el) {
                if (el === rangeDOM.sc) {
                    break;
                }
                if (el.nodeType === 3 && isVisible(el.parentNode)) {
                    return;
                }
                if (el.firstChild) {
                    el = el.firstChild;
                } else if (el.nextSibling) {
                    el = el.nextSibling;
                } else if (el.parentNode !== this.editable) {
                    el = el.parentNode.nextSibling;
                } else {
                    el = null;
                }
            }
        }

        if (this.editable.contains(rangeDOM.ec)) {
            el = this.editable;
            while (el) {
                if (el === rangeDOM.ec) {
                    break;
                }
                if (el.nodeType === 3 && isVisible(el)) {
                    return;
                }
                if (el.lastChild) {
                    el = el.lastChild;
                } else if (el.previousSibling) {
                    el = el.previousSibling;
                } else if (el.parentNode !== this.editable) {
                    el = el.parentNode.previousSibling;
                } else {
                    el = null;
                }
            }
        }

        var ev = this._eventsNormalization({type: 'selectAll'});
        UserInput.trigger(ev.name, ev);

        if (ev.defaultPrevented) {
            this.dependencies.BaseRange.restore();
        } else {
            this.dependencies.BaseRange.selectAll();
        }
    }
};

we3.pluginsRegistry.BaseUserInput = BaseUserInput;

})();
