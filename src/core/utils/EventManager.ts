
const navigationKey = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'PageUp',
    'PageDown',
    'End',
    'Home',
];
interface Range {
    sc: any
    so: number
    ec: any
    eo: number
    ltr: boolean
};
interface CompiledEvent {
    type: string,
    key: string,
    data: string,
    shiftKey: boolean,
    ctrlKey: boolean,
    altKey?: boolean
    mutationsList: Array<MutationEvent>,
    defaultPrevented: boolean,
    events: Array<Event>,
    update?: boolean,
    previous?: CompiledEvent
    node?: ParentNode | HTMLElement
    clone?: any
};
interface NormalizedEvent {
    name: string
    data?: string
    shiftKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
    previous?: string
    targetID?: number
    preventDefault: Function
    defaultPrevented: boolean
};

export class EventManager {
    editor: HTMLElement
    editable: HTMLElement
    options: any
    _compiledEvent: CompiledEvent
    _observer: MutationObserver
    _eventToRemoveOnDestroy: Array<any>
    _previousEvent: any
    _mousedownInEditable: any
    _editorFocused: boolean
    _clonedNodeFormComposition: HTMLElement

    constructor (editor, editable, options) {
        this.editor = editor;
        this.editable = editable;
        this.options = options;
        this._eventToRemoveOnDestroy = [];
        this._bindEvents();
    }
    blurEditor () {
        this._editorFocused = false;
    }
    focusEditor () {
        this._editorFocused = true;
    }
    destroy () {
        this._observer.disconnect();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Add a newline at range: split a paragraph if possible, after
     * removing the selection if needed.
     */
    _addLine () {
        console.log('trigger Action: addLine');
    }
    _beginToStackEventDataForNextTick (e) {
        if (this._compiledEvent) {
            this._compiledEvent.events.push(e);
            return this._compiledEvent;
        }
        this._compiledEvent = {
            type: null,
            key: 'Unidentified',
            data: '',
            shiftKey: false,
            ctrlKey: false,
            mutationsList: [],
            defaultPrevented: false,
            events: [e],
        };
        setTimeout(this._tickAfterUserInteraction.bind(this));
        return this._compiledEvent;
    }
    _bindEvents () {
        this._bindDOMEvents(window.top.document, {
            selectionchange: '_onSelectionChange',
            click: '_onClick',
            touchend: '_onClick',
            contextmenu: '_onContextMenu',
        });
        this._bindDOMEvents(this.editable, {
            keydown: '_onKeyDown',
            keypress: '_onKeyDown',
            input: '_onInput',
            compositionend: '_onCompositionEnd',
            compositionstart: '_onCompositionStart',
            compositionupdate: '_onCompositionUpdate',
            mousedown: '_onMouseDown',
            touchstart: '_onMouseDown',
        });
        this._observer = new MutationObserver((mutationsList: any) => {
            if (this._compiledEvent) {
                this._compiledEvent.mutationsList = this._compiledEvent.mutationsList.concat(mutationsList);
            }
        });
        this._observer.observe(this.editable, {
            characterData: true,
            childList: true,
            subtree: true,
        });
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
            self._eventToRemoveOnDestroy.push({
                target: dom,
                name: eventName,
                value: value,
            });
            dom.addEventListener(eventName, value, false);
        });
    }
    _cloneForComposition () {
        if (this._compiledEvent.clone) {
            return;
        }
        var range = this._getRange()
        var format = range.sc;
        while (format.parentNode && format !== this.editable && window.getComputedStyle(format).display !== 'block') {
            format = format.parentNode;
        }
        this._compiledEvent.node = format;
        this._compiledEvent.clone = format.cloneNode(true);
    }
    _eventsNormalization (param) {
        var name, data, shiftKey, ctrlKey, altKey, targetID, previous;

        if (navigationKey.indexOf(param.key) !== -1) {
            name = 'move';
            data = param.key;
            shiftKey = param.shiftKey;
            ctrlKey = param.ctrlKey;
            altKey = param.altKey;
        } else if (param.type === 'move') {
            name = 'move';
            data = param.data;
            targetID = param.targetID;
        } else if (param.type === 'composition') {
            data = param.data;
            // previous.update = audroid update for each char
            // param.data[0] !== ' ' = audio insertion
            previous = param.data[0] !== ' ' && param.previous && param.previous.update ? param.previous.data : false;
            name = 'composition';
        } else {
            shiftKey = param.shiftKey;
            ctrlKey = param.ctrlKey;
            altKey = param.altKey;
            if (param.key === 'Backspace') {
                name = 'Backspace';
            } else if (param.key === 'Delete') {
                name = 'Delete';
            } else if (param.key === 'Tab') {
                name = 'Tab';
            } else if (param.key === 'Enter') {
                name = 'Enter';
            } else if ((!param.ctrlKey && !param.altKey || param.inputType === 'insertText') &&
                    (param.data && param.data.length === 1 || param.key && param.key.length === 1 || param.key === 'Space')) {
                data = param.data && param.data.length === 1 ? param.data : param.key;
                if (param.data === 'Space') {
                    param.data = ' ';
                }
                name = 'char';
            }
        }

        if (!name) {
            name = 'default';
        }

        var ev: NormalizedEvent = {
            name: name,
            data: data,
            shiftKey: shiftKey,
            altKey: altKey,
            targetID: targetID,
            previous: previous,
            preventDefault: function () {
                param.defaultPrevented = true;
            },
            get defaultPrevented () {
                return param.defaultPrevented;
            }
        };
        return ev;
    }
    _eventsdDispatcher (ev, mutationsList) {
        if (ev.defaultPrevented && ev.name !== 'move') {
            console.log('trigger Action: nothing');
        }

        if (ev.name === 'composition') {
            this._pressInsertComposition(ev);
        } else if (ev.name === 'Backspace') {
            this._pressRemoveSide(true);
        } else if (ev.name === 'Delete') {
            this._pressRemoveSide(false);
        } else if (ev.name === 'Tab') {
            this._pressInsertTab(ev);
        } else if (ev.name === 'Enter') {
            this._pressInsertEnter(ev);
        } else if (ev.name === 'char') {
            this._pressInsertChar(ev);
        } else if (ev.name === 'move') {
            this._pressMove(ev);
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
    /**
     * Move the current range to the current selection in the DOM
     * (the native range).
     *
     * @returns {Range}
     */
    _getRange () {
        var selection = this.editable.ownerDocument.getSelection();
        if (!selection || selection.rangeCount === 0) {
            var range: Range = {
                sc: this.editable,
                so: 0,
                ec: this.editable,
                eo: 0,
                ltr: false,
            };
            return range;
        }
        var nativeRange = selection.getRangeAt(0);
        var ltr;
        if (selection.anchorNode === selection.focusNode) {
            ltr = selection.anchorOffset <= selection.focusOffset;
        } else {
            ltr = selection.anchorNode === nativeRange.startContainer;
        }
        var range: Range = {
            sc: nativeRange.startContainer,
            so: nativeRange.startOffset,
            ec: nativeRange.endContainer,
            eo: nativeRange.endOffset,
            ltr: ltr,
        };
        return range;
    }
    _isSelectAll (rangeDOM) {
        var sc = rangeDOM.sc;
        var so = rangeDOM.so;
        var ec = rangeDOM.ec;
        var eo = rangeDOM.eo;

        if (rangeDOM.isCollapsed() || !sc || !ec) {
            return false;
        }

        var body = this.editable.ownerDocument.body;
        if (!body.contains(sc) || !body.contains(ec)) {
            return false;
        }
        if (sc.childNodes[so]) {
            sc = sc.childNodes[so];
            so = 0;
        }
        if (ec.childNodes[eo]) {
            ec = ec.childNodes[eo];
        }
        if (so !== 0 || ec.nodeType === 3 && eo !== ec.textContent.length) {
            return false;
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
        if (this.editable.contains(sc)) {
            el = this.editable;
            while (el) {
                if (el === sc) {
                    break;
                }
                if (el.nodeType === 3 && isVisible(el.parentNode)) {
                    return false;
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

        if (this.editable.contains(ec)) {
            el = this.editable;
            while (el) {
                if (el === ec) {
                    break;
                }
                if (el.nodeType === 3 && isVisible(el)) {
                    return false;
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
        return true;
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertChar (param) {
        if (param.data === ' ') {
            console.log('trigger Action: insert', ['\u00A0']);
        } else if (param.data.charCodeAt(0) === 10) {
            console.log('trigger Action: insert', ['<br/>']);
        } else {
            console.log('trigger Action: insert', [param.data]);
        }
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertComposition (param) {
        // var self = this;
        // var BaseArch = this.dependencies.BaseArch;
        // var BaseRenderer = this.dependencies.BaseRenderer;
        // var BaseRange = this.dependencies.BaseRange;

        // return BaseArch.do(function () {
        //     var range = BaseRange.getRange();
        //     var archNode = range.scArch;
        //     var arch = archNode.ancestor('isFormatNode') || archNode.ancestor('isUnbreakable');
        //     var formatNode = BaseRenderer.getElement(arch);

        //     if (!formatNode) {
        //         return false; // default behavior of range from `Arch._processChanges`
        //     }

        //     var lastTextNode;
        //     var lastTextNodeOldValue;
        //     var newArch = BaseArch.parse(formatNode.cloneNode(true));
        //     newArch.nextUntil(function (archNode) {
        //         if (!archNode.isText()) {
        //             return;
        //         }
        //         var target = arch.applyPath(archNode.path(newArch));
        //         if (target && target.isText()) {
        //             lastTextNodeOldValue = target.nodeValue;
        //             lastTextNode = target;

        //             if (range.scID === lastTextNode.id && param.previous) {
        //                 // eg: 'paaa' from replacement of 'a' in 'aa' ==> must be 'paa'
        //                 var previous = param.previous ? param.previous.replace(/\u00A0/g, ' ') : '';
        //                 var beforeRange = lastTextNodeOldValue.replace(/\u00A0/g, ' ').slice(0, range.so);
        //                 var afterRange = lastTextNodeOldValue.replace(/\u00A0/g, ' ').slice(range.so);
        //                 if (previous && beforeRange.slice(-previous.length) === previous) {
        //                     beforeRange = beforeRange.slice(0, -previous.length);
        //                 }
        //                 archNode.nodeValue = beforeRange + param.data + afterRange;
        //             }

        //             target.setNodeValue(archNode.nodeValue);
        //         } else if (target && target.isBR()) {
        //             var res = target.insert(archNode.params.create(null, null, archNode.nodeValue));
        //             lastTextNodeOldValue = archNode.nodeValue;
        //             lastTextNode = res[0];
        //         }
        //     }, {doNotLeaveNode: true});

        //     if (lastTextNode) {
        //         var lastTextNodeNewValue = lastTextNode.nodeValue.replace(/\u00A0/g, ' ');
        //         var newOffset = lastTextNodeNewValue.length;

        //         param.data = param.data.replace(/\u00A0/g, ' ');
        //         if (lastTextNode.id === range.scID) {
        //             var offset = 0;
        //             if (lastTextNode.id === range.scID) {
        //                 offset = range.so;
        //                 if (lastTextNodeOldValue.length > lastTextNodeNewValue.length) {
        //                     offset -= lastTextNodeOldValue.length - lastTextNodeNewValue.length;
        //                     if (offset < 0) {
        //                         offset = 0;
        //                     }
        //                 }
        //             }

        //             newOffset = self._findOffsetInsertion(lastTextNodeNewValue, offset, param.data);
        //             newOffset = newOffset !== -1 ? newOffset : offset;

        //             if (lastTextNodeNewValue[newOffset] === ' ') {
        //                 newOffset++;
        //             }
        //         }

        //         newOffset = Math.min(newOffset, lastTextNode.nodeValue.length);
        //         return {
        //             scID: lastTextNode.id,
        //             so: newOffset,
        //         };
        //     }

        //     var lastLeaf = formatNode.lastLeaf();
        //     if (lastLeaf) {
        //         return {
        //             scID: lastLeaf.id,
        //             so: lastLeaf.length(),
        //         };
        //     }

        //     var rangeDOM = BaseRange.getRangeFromDOM();
        //     if (rangeDOM && rangeDOM.scID && rangeDOM.scArch.length() <= rangeDOM.so) {
        //         return {
        //             scID: rangeDOM.scID,
        //             so: rangeDOM.so,
        //         };
        //     }
        //     return false; // default behavior of range from `Arch._processChanges`
        // });
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertEnter (param) {
        if (param.shiftKey) {
            console.log('trigger Action: insert', ['<br/>']);
        } else {
            console.log('trigger Action: enter, or outdent');

            /*
            var range = BaseRange.getRange();
            var liAncestor = range.scArch.ancestor('isLi');
            var isInEmptyLi = range.isCollapsed() && liAncestor && liAncestor.isDeepEmpty();
            if (isInEmptyLi) {
                return BaseArch.outdent();
            } else {
                return this._addLine();
            }
            */
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
            console.log('trigger Action: nothing');
            return;
        }
        if (param.shiftKey || param.ctrlKey || param.altKey) {
            console.log('trigger Action: nothing');
            return;
        }
        var tabSize = this.options.tab && this.options.tab.size || 0;
        var tab = new Array(tabSize).fill('\u00A0').join('');

        console.log('trigger Action: insert', [tab]);
    }
    _pressMove (param) {
        if (param.defaultPrevented) {
            console.log('trigger Action: restore range');
        }
        if (param.data === 'SelectAll') {
            console.log('trigger Action: selectAll');
        } else if (navigationKey.indexOf(param.data) !== -1) {
            var isLeftish = ['ArrowUp', 'ArrowLeft', 'PageUp', 'Home'].indexOf(param.data) !== -1;
            console.log('trigger Action: setRangeFromDom', {
                moveLeft: isLeftish,
                moveRight: !isLeftish,
            });
        } else if (param.targetID) {
            console.log('trigger Action: setRange', {
                scID: param.targetID,
                so: 0,
            });
        } else {
            console.log('trigger Action: setRangeFromDom', {});
        }
    }
    /**
     * Remove to the side of the current range.
     *
     * @private
     * @param {Boolean} isLeft true to remove to the left
     */
    _pressRemoveSide (isLeft) {
        console.log('trigger Action: remove', isLeft ? 'left' : 'right');
    }
    _tickAfterUserInteraction () {
        var param = this._compiledEvent;
        param.previous = this._previousEvent;
        this._previousEvent = param;
        this._compiledEvent = null;
        var ev = this._eventsNormalization(param);
        if (ev.name === 'default') {
            console.log('trigger Action: ???', param);
        } else {
            this._eventsdDispatcher(ev, param.mutationsList);
        }
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {MouseEvent} e
     */
    _onCompositionEnd (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        var param = this._beginToStackEventDataForNextTick(e);
        this._cloneForComposition();
        param.type = 'composition';
        param.update = false;
        param.data = e.data;
    }
    _onCompositionStart (e) {
        if (this.editable.style.display !== 'none') {
            this._beginToStackEventDataForNextTick(e);
            this._cloneForComposition();
        }
    }
    _onCompositionUpdate (e) {
        if (this.editable.style.display !== 'none') {
            this._beginToStackEventDataForNextTick(e);
            this._cloneForComposition();
        }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onContextMenu (e) {
        this._mousedownInEditable = false;
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onInput (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        var param = this._beginToStackEventDataForNextTick(e);

        if (!param.type) {
            param.type = e.type;
            param.data = e.data;
        }

        // todo: delete word <=> composition

        if (e.inputType === 'insertCompositionText' || e.inputType === 'insertReplacementText') {
            param.update = param.update || param.type !== 'composition';
            param.type = 'composition';
            param.data = e.data;
            this._cloneForComposition();
        } else if (e.inputType === 'insertParagraph' && param.key === 'Unidentified') {
            param.key = 'Enter';
        } else if (e.inputType === 'deleteContentBackwards' && param.key === 'Unidentified') {
            param.key = 'Backspace';
        } else if (e.inputType === 'deleteContentForward' && param.key === 'Unidentified') {
            param.key = 'Delete';
        } else if (!param.data) {
            param.data = e.data;
        } else if (e.inputType === "insertText") {
            if (param.type.indexOf('key') === 0 && param.key.length === 1 && e.data.length === 1) {
                param.key = e.data; // keep accent
            } else if (e.data && e.data.length === 1 && e.data !== param.data && param.type === 'composition') {
                // swiftKey add automatically a space after the composition, without this line the arch is correct but not the range
                param.data += e.data;
            } else if (param.key === 'Unidentified') {
                param.key = e.data;
            }
        }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onKeyDown (e) {
        if (this.editable.style.display === 'none') {
            return;
        }
        if (e.type === 'keydown' && e.key === 'Dead') {
            return;
        }
        var param = this._beginToStackEventDataForNextTick(e);
        param.defaultPrevented = param.defaultPrevented || e.defaultPrevented;
        param.type = param.type || e.type;
        param.shiftKey = e.shiftKey;
        param.ctrlKey = e.ctrlKey;
        param.altKey = e.altKey;
        param.key = e.key;
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onMouseDown (e) {
        this._previousEvent = null;
        this._mousedownInEditable = e;
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onClick (e) {
        if (!this._mousedownInEditable) {
            return;
        }
        setTimeout(this.__onClick.bind(this, 0));
    }
    __onClick (e) {
        var mousedown = this._mousedownInEditable.target;
        this._mousedownInEditable = false;

        if (this.editor.contains(e.target) && this.editable !== e.target && !this.editable.contains(e.target)) {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                console.log('trigger Action: restore range');
                return;
            }
        }
        if (mousedown === e.target) {
            console.log('trigger Action: setRange', {sc: e.target});
        } else {
            console.log('trigger Action: setRangeFromDom');
        }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onSelectionChange (e) {
        if (!this._editorFocused || this._mousedownInEditable || this.editable.style.display === 'none') {
            return;
        }
        if (this._isSelectAll(this._getRange())) {
            console.log('trigger Action: selectAll');
        }
    }
};
