
import { Range } from '../stores/Range'

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
    preventDefault: Function
    defaultPrevented: boolean
    elements: Array<Element>,
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
        this.triggerEvent('trigger Action: addLine');
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
     * implement that ourselves ?
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
        var range = this._getRange();
        var format = range.startContainer;
        while (format.parentNode && format !== this.editable && window.getComputedStyle(format).display !== 'block') {
            format = format.parentNode;
        }
        this._compiledEvent.node = format;
        this._compiledEvent.clone = format.cloneNode(true);
    }
    _eventsNormalization (param) {
        if (param.defaultPrevented && param.name !== 'move') {
            this.triggerEvent('trigger Action: nothing');
            return;
        }

        // mark as dirty the new nodes to re-render it
        // because the browser can split other than our arch and we must fix the errors
        var elements = [];
        param.mutationsList.forEach(function (mutation) {
            if (mutation.type === 'characterData' && elements.indexOf(mutation.target) === -1) {
                elements.push(mutation.target);
            }
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function (target) {
                    if (elements.indexOf(target) === -1) {
                        elements.push(target);
                    }
                });
                mutation.removedNodes.forEach(function (target) {
                    if (elements.indexOf(target) === -1) {
                        elements.push(target);
                    }
                });
            }
        });

        if (navigationKey.indexOf(param.key) !== -1) {
            this._pressMove({
                name: 'move',
                data: param.key,
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.type === 'move') {
            this._pressMove({
                name: 'move',
            });
        } else if (param.type === 'composition') {
            // previous.update = audroid update for each char
            // param.data[0] !== ' ' = audio insertion
            this._pressInsertComposition({
                previous: param.data[0] !== ' ' && param.previous && param.previous.update ? param.previous.data : false,
                name: 'composition',
                data: param.data,
                node: param.node,
                clone: param.clone,
            });
        } else if (param.key === 'Backspace' || param.key === 'Delete') {
            this._pressRemoveSide({
                name: param.key,
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.key === 'Tab') {
            this._pressInsertTab({
                name: 'Tab',
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.key === 'Enter') {
            this._pressInsertTab({
                name: 'Enter',
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if ((!param.ctrlKey && !param.altKey || param.inputType === 'insertText') &&
                (param.data && param.data.length === 1 || param.key && param.key.length === 1 || param.key === 'Space')) {
            var data = param.data && param.data.length === 1 ? param.data : param.key;
            if (param.data === 'Space') {
                data = ' ';
            }
            this._pressInsertChar({
                name: 'char',
                data: data,
            });
        } else if (param.type === "keydown") {
            this.triggerEvent('trigger Action: keydown', param);
        } else {
            this.triggerEvent('trigger Action: ???', param);
        }
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
                startContainer: this.editable,
                startOffset: 0,
                endContainer: this.editable,
                endOffset: 0,
                direction: 'rtl',
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
            startContainer: nativeRange.startContainer,
            startOffset: nativeRange.startOffset,
            endContainer: nativeRange.endContainer,
            endOffset: nativeRange.endOffset,
            direction: ltr ? 'ltr' : 'rtl',
        };
        return range;
    }
    _isSelectAll (rangeDOM) {
        var startContainer = rangeDOM.startContainer;
        var startOffset = rangeDOM.startOffset;
        var endContainer = rangeDOM.endContainer;
        var endOffset = rangeDOM.endOffset;

        if (rangeDOM.isCollapsed() || !startContainer || !endContainer) {
            return false;
        }

        var body = this.editable.ownerDocument.body;
        if (!body.contains(startContainer) || !body.contains(endContainer)) {
            return false;
        }
        if (startContainer.childNodes[startOffset]) {
            startContainer = startContainer.childNodes[startOffset];
            startOffset = 0;
        }
        if (endContainer.childNodes[endOffset]) {
            endContainer = endContainer.childNodes[endOffset];
        }
        if (startOffset !== 0 || endContainer.nodeType === 3 && endOffset !== endContainer.textContent.length) {
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
        if (this.editable.contains(startContainer)) {
            el = this.editable;
            while (el) {
                if (el === startContainer) {
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

        if (this.editable.contains(endContainer)) {
            el = this.editable;
            while (el) {
                if (el === endContainer) {
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
            this.triggerEvent('trigger Action: insert', ['\u00A0']);
        } else if (param.data.charCodeAt(0) === 10) {
            this.triggerEvent('trigger Action: insert', ['<br/>']);
        } else {
            this.triggerEvent('trigger Action: insert', [param.data]);
        }
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertComposition (param) {
        // if (!this.editable.contains(param.node)) {
        //     this.triggerEvent('trigger Action: ??? wtf ???');
        //     return;
        // }

        // var data = param.data.replace(/\u00A0/g, ' ');
        // var range = this._getRange();
        // var origin = {
        //     startContainer: null,
        //     startOffset: null,
        //     endContainer: null,
        //     endOffset: null,
        // };

        // function findTextNode (textNodes, node) {
        //     if (node.nodeType === 3) {
        //         textNodes.push(node);
        //     } else if (node.tagName === 'BR') {
        //         textNodes.push(node);
        //     } else {
        //         node.childNodes.forEach(n => findTextNode(textNodes, n));
        //     }
        //     return textNodes;
        // }
        // var cloneTextNodes = findTextNode([], param.clone);
        // var textNodes = findTextNode([], param.node);

        // this.triggerEvent(cloneTextNodes.map(a => a.nodeValue).join('|'));
        // this.triggerEvent(textNodes.map(a => a.nodeValue).join('|'));

        // // find the original start range

        // var node, clone;
        // for (var index = 0; index < textNodes.length; index++) {
        //     node = textNodes[index];
        //     clone = cloneTextNodes[index];
        //     if (clone.tagName !== node.tagName || clone.nodeValue !== node.nodeValue) {
        //         break;
        //     }
        // }
        // if (index === textNodes.length) {
        //     this.triggerEvent('trigger Action: nothing');
        //     return;
        // }

        // if (clone.nodeType === 3) {
        //     var beforeRange = '';
        //     if (range.startContainer === node && param.previous) {
        //         // eg: 'paaa' from replacement of 'a' in 'aa' ==> must be 'paa'
        //         let previous = param.previous ? param.previous.replace(/\u00A0/g, ' ') : '';
        //         beforeRange = clone.nodeValue.replace(/\u00A0/g, ' ').slice(0, range.so);
        //         // let afterRange = clone.nodeValue.replace(/\u00A0/g, ' ').slice(range.so);
        //         if (previous && beforeRange.slice(-previous.length) === previous) {
        //             beforeRange = beforeRange.slice(0, -previous.length);
        //         }
        //     }
        //     if (!origin.startContainer) {
        //         origin.startContainer = clone; // TODO: clone.origin
        //         origin.startOffset = beforeRange.length;
        //     }
        // } else {
        //     if (!origin.startContainer) {
        //         origin.startContainer = clone; // TODO: clone.origin
        //         origin.startOffset = 0;
        //     }
        // }

        // // find the original end range

        // var node, clone;
        // for (var indexBis = textNodes.length - 1; indexBis > index; indexBis++) {
        //     node = textNodes[indexBis];
        //     clone = cloneTextNodes[indexBis];
        //     if (clone.tagName !== node.tagName || clone.nodeValue !== node.nodeValue) {
        //         break;
        //     }
        // }
        // if (indexBis === index) {
        //     origin.endContainer = origin.startContainer;
        //     origin.endOffset = origin.startContainer;
        // }

        // if (clone.nodeType === 3) {
        //     origin.startContainer = clone; // TODO: clone.origin
        //     for(var offset = 0; offset < clone.nodeValue.length; offset++) {
        //         if (clone.nodeValue[offset] !== node.nodeValue[offset]) {
        //             break;
        //         }
        //     }
        //     origin.startOffset = offset;
        // } else {
        //     if (!origin.startContainer) {
        //         origin.startContainer = clone; // TODO: clone.origin
        //         origin.startOffset = 0;
        //     }
        // }

        // if (lastTextNode) {
        //     var lastTextNodeNewValue = lastTextNode.nodeValue.replace(/\u00A0/g, ' ');
        //     var newOffset = lastTextNodeNewValue.length;

        //     param.data = param.data.replace(/\u00A0/g, ' ');
        //     if (lastTextNode.id === range.scID) {
        //         var offset = 0;
        //         if (lastTextNode.id === range.scID) {
        //             offset = range.so;
        //             if (lastTextNodeOldValue.length > lastTextNodeNewValue.length) {
        //                 offset -= lastTextNodeOldValue.length - lastTextNodeNewValue.length;
        //                 if (offset < 0) {
        //                     offset = 0;
        //                 }
        //             }
        //         }

        //         newOffset = self._findOffsetInsertion(lastTextNodeNewValue, offset, param.data);
        //         newOffset = newOffset !== -1 ? newOffset : offset;

        //         if (lastTextNodeNewValue[newOffset] === ' ') {
        //             newOffset++;
        //         }
        //     }

        //     newOffset = Math.min(newOffset, lastTextNode.nodeValue.length);
        //     return {
        //         scID: lastTextNode.id,
        //         so: newOffset,
        //     };
        // }

    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertEnter (param) {
        if (param.shiftKey) {
            this.triggerEvent('trigger Action: insert', ['<br/>']);
        } else {
            this.triggerEvent('trigger Action: enter, or outdent');

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
            this.triggerEvent('trigger Action: nothing');
            return;
        }
        if (param.shiftKey || param.ctrlKey || param.altKey) {
            this.triggerEvent('trigger Action: nothing');
            return;
        }
        var tabSize = this.options.tab && this.options.tab.size || 0;
        var tab = new Array(tabSize).fill('\u00A0').join('');

        this.triggerEvent('trigger Action: insert', [tab]);
    }
    _pressMove (param) {
        if (param.defaultPrevented) {
            this.triggerEvent('trigger Action: restore range');
        }
        if (param.data === 'SelectAll') {
            this.triggerEvent('trigger Action: selectAll');
        } else if (navigationKey.indexOf(param.data) !== -1) {
            var isLeftish = ['ArrowUp', 'ArrowLeft', 'PageUp', 'Home'].indexOf(param.data) !== -1;
            this.triggerEvent('trigger Action: setRangeFromDom', {
                moveLeft: isLeftish,
                moveRight: !isLeftish,
            });
        } else {
            this.triggerEvent('trigger Action: setRangeFromDom', {});
        }
    }
    /**
     * Remove to the side of the current range.
     *
     * @private
     * @param {Boolean} isLeft true to remove to the left
     */
    _pressRemoveSide (param) {
        this.triggerEvent('trigger Action: remove', param.key === 'Backspace' ? 'left' : 'right', param);
    }
    _tickAfterUserInteraction () {
        var param = this._compiledEvent;
        param.previous = this._previousEvent;
        this._previousEvent = param;
        this._compiledEvent = null;
        this._eventsNormalization(param);
    }
    triggerEvent (truc, a=null, b=null) {
        var d = document.createElement('div');
        d.textContent = truc + ' ' + (a ? JSON.stringify(a) : '');
        document.body.appendChild(d);

        console.log(truc, a, b);
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
                this.triggerEvent('trigger Action: restore range');
                return;
            }
        }
        if (mousedown === e.target) {
            this.triggerEvent('trigger Action: setRange', {startContainer: e.target});
        } else {
            this.triggerEvent('trigger Action: setRangeFromDom');
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
            this.triggerEvent('trigger Action: selectAll');
        }
    }
};
