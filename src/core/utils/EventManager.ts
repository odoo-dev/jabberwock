
import { Range } from '../stores/Range'
import { DOMElement } from '../types/DOMElement'

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

// As of August 29th 2019, InputEvent is considered experimental by MDN as some
// of its properties are said to be unsupported by Edge and Safari. This is
// probably the reason why its type definition is not included in the basic
// TypeScript distribution. However, these properties actually appear to be
// working perfectly fine on these browser after some manual testing on MacOS.
interface InputEvent extends UIEvent {
    readonly data: string
    readonly dataTransfer: DataTransfer
    readonly inputType: string
    readonly isComposing: boolean
}

interface CompiledEvent {
    type: string
    key?: string
    shiftKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
    data?: string
    mutationsList?: Array<MutationRecord>
    defaultPrevented?: boolean
    events?: Array<Event>
    update?: boolean
    previous?: any
    node?: DOMElement
    clone?: any
};

interface EventNormalizerOptions {
    dispatch: Function
    tab?: {
        enabled: boolean
        size: number
    }
}

export class EventManager {
    editor: DOMElement
    editable: DOMElement
    options: any
    _compiledEvent: CompiledEvent
    _observer: MutationObserver
    _eventToRemoveOnDestroy: Array<any>
    _previousEvent: any
    _mousedownInEditable: any
    _editorFocused: boolean
    _clonedNodeFormComposition: HTMLElement

    constructor (editor: HTMLElement, editable: HTMLElement, options: EventNormalizerOptions) {
        this.editor = <DOMElement>editor;
        this.editable = <DOMElement>editable;
        this.options = options;
        this._bindDOMEvents(window.top.document.documentElement, {
            selectionchange: this._onSelectionChange.bind(this),
            click: this._onClick.bind(this),
            touchend: this._onClick.bind(this),
            contextmenu: this._onContextMenu.bind(this),
        });
        this._bindDOMEvents(this.editable, {
            keydown: this._onKeyDown.bind(this),
            keypress: this._onKeyDown.bind(this),
            input: this._onInput.bind(this),
            compositionend: this._onCompositionEnd.bind(this),
            compositionstart: this._onCompositionStart.bind(this),
            compositionupdate: this._onCompositionUpdate.bind(this),
            mousedown: this._onMouseDown.bind(this),
            touchstart: this._onMouseDown.bind(this),
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
    /** todo */
    blurEditor () {
        this._editorFocused = false;
        this.destroy(this.editable);
    }
    /** todo */
    focusEditor () {
        this._editorFocused = true;
    }
    /**
     * Called when destroy the editor.
     * Remove all added handlers.
     *
     */
    destroy (el: HTMLElement) {
        this._observer.disconnect();
        this._eventToRemoveOnDestroy.forEach(function (eventObject) {
            eventObject.target.removeEventListener(eventObject.name, eventObject.method);
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * This method is called by each event handler and create a CompiledEvent.
     * After a tick (setTimeout 0ms) the method '_tickAfterUserInteraction' is
     * called.
     * All events during a tick are caught and the CompiledEvent object is
     * complete. This analysis removes most of the action desired by the user.
     * Actions such as special character insertion, delete, backspace,
     * spellcheckers...
     * User events are received per packet, corresponding to an action.
     *
     * @see _tickAfterUserInteraction
     * @returns {CompiledEvent}
     */
    _beginToStackEventDataForNextTick () {
        if (this._compiledEvent) {
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
        };
        setTimeout(this._tickAfterUserInteraction.bind(this));
        return this._compiledEvent;
    }
    /**
     * Add handler event on DOM elements
     *
     * @private
     * @param {Node} element
     * @param {Object []} events {[eventName]: {Function}}
     */
    _bindDOMEvents(element: Element, events) {
        if (!this._eventToRemoveOnDestroy) {
            this._eventToRemoveOnDestroy = [];
        }
        for (let eventName in events) {
            this._eventToRemoveOnDestroy.push({
                target: element,
                name: eventName,
                method: events[eventName],
            });
            element.addEventListener(eventName, events[eventName], false);
        }
    }
    /**
     * Called when we detect a composition user action.
     * Create a clone of the DOM (block parent of the range) will used to
     * analyse and extract the real insertion and the range on which the
     * change applies.
     * The clone is added to the CompiledEvent
     *
     * @private
     */
    _cloneForComposition (): void {
        // Check if already cloned earlier
        if (this._compiledEvent.clone) {
            return;
        }

        const range = this._getRange();
        let format = range.startContainer;
        while (format.parentNode && format !== this.editable && (format.nodeType === 3 || window.getComputedStyle(format).display !== 'block')) {
            format = format.parentNode;
        }
        var clone: ClonedNode = format.cloneNode(true);
        clone.origin = format;
        this._compiledEvent.clone = clone;

        (function addChildOrigin (clone: ClonedNode) {
            if (clone.nodeType !== 1) {
                return;
            }
            var childNodes = <NodeListOf<Element>>clone.origin.childNodes;
            clone.childNodes.forEach((child: ClonedNode, index) => {
                child.origin = childNodes[index];
                addChildOrigin(child);
            });
        })(clone);
    }
    /**
     * Called when we the CompiledEvent is ready by _tickAfterUserInteraction
     * Trigger the different actions according to the event analysis performed.
     *
     * @see _tickAfterUserInteraction
     * @private
     * @param {CompiledEvent} param
     */
    _eventsNormalization(param: CompiledEvent) {
        if (param.defaultPrevented && param.type !== 'move') {
            this.triggerEvent('trigger Action: nothing');
            return;
        }

        // mark as dirty the new nodes to re-render it
        // because the browser can split other than our arch and we must fix the errors
        const elements: Node[] = [];
        param.mutationsList.forEach(mutation => {
            if (mutation.type === 'characterData' && elements.indexOf(mutation.target) === -1) {
                elements.push(mutation.target);
            }
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(target => {
                    if (elements.indexOf(target) === -1) {
                        elements.push(target);
                    }
                });
                mutation.removedNodes.forEach(target => {
                    if (elements.indexOf(target) === -1) {
                        elements.push(target);
                    }
                });
            }
        });

        if (navigationKey.indexOf(param.key) !== -1) {
            this._pressMove({
                type: 'move',
                key: param.key,
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.type === 'move') {
            this._pressMove({
                type: 'move',
            });
        } else if (param.type === 'composition') {
            // previous.update = audroid update for each char
            // param.data[0] !== ' ' = audio insertion
            this._pressInsertComposition({
                previous: param.data[0] !== ' ' && param.previous && param.previous.update ? param.previous.data : false,
                type: 'composition',
                data: param.data,
                node: param.node,
                clone: param.clone,
            });
        } else if (param.key === 'Backspace' || param.key === 'Delete') {
            this._pressRemoveSide({
                type: param.key,
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.key === 'Tab') {
            this._pressInsertTab({
                type: 'Tab',
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if (param.key === 'Enter') {
            this._pressInsertTab({
                type: 'Enter',
                shiftKey: param.shiftKey,
                ctrlKey: param.ctrlKey,
                altKey: param.altKey,
            });
        } else if ((!param.ctrlKey && !param.altKey) &&
                (param.data && param.data.length === 1 || param.key && param.key.length === 1 || param.key === 'Space')) {
            let data = param.data && param.data.length === 1 ? param.data : param.key;
            if (param.data === 'Space') {
                data = ' ';
            }
            this._pressInsertChar({type: 'char', data: data});
        } else if (param.type === "keydown") {
            this.triggerEvent('trigger Action: keydown', param);
        } else {
            this.triggerEvent('trigger Action: ???', param);
        }
    }
    /**
     * Convert a node list of node into a list of char linked to an element
     * and offset.
     * Two lists can then be compared to know where they diverge.
     *
     * @private
     * @param {Element[]} textNodes
     * @returns {Object} {chars, nodes, offsets}
     */
    _extractChars(textNodes: Array<Element>) {
        let chars: Array<string> = [];
        let nodes: Array<DOMElement> = [];
        let offsets: Array<number> = [];
        textNodes.forEach(function (node) {
            if (node.nodeValue) {
                node.nodeValue.split('').forEach(function (char, index) {
                    chars.push(char);
                    nodes.push(node);
                    offsets.push(index);
                });
            } else {
                chars.push(null);
                nodes.push(node);
                offsets.push(0);
            }
        });
        return {
            chars: chars,
            nodes: nodes,
            offsets: offsets,
        };
    }
    /**
     * Return the list of text node and BR contained in an element.
     *
     * @private
     * @param {Element} node
     * @returns {Element[]}
     */
    _findTextNode (node, textNodes: Array<Element>) {
        if (!textNodes) {
            textNodes = [];
        }
        if (node.nodeType === 3) {
            textNodes.push(node);
        } else if (node.tagName === 'BR') {
            textNodes.push(node);
        } else {
            node.childNodes.forEach(n => this._findTextNode(n, textNodes));
        }
        return textNodes;
    }
    /**
     * Compare to extracted list of char to define the start and the end
     * of the changes. Return the indexes from each list.
     *
     * @see _extractChars
     * @private
     * @param {Object} extractedCloneChars
     * @param {Object} extractedChars
     * @returns {Object} {startClone, endClone, start, end}
     */
    _findOriginChanges(extractedCloneChars, extractedChars) {
        const cloneLength = extractedCloneChars.chars.length - 1;
        const length = extractedChars.chars.length - 1;

        let startClone = 0,
            endClone = cloneLength,
            start = 0,
            end = length;

        for (start; start <= cloneLength; start++) {
            if (extractedCloneChars.chars[start] !== extractedChars.chars[start]) {
                startClone = start;
                break;
            }
        }

        for (endClone; endClone >= 0; endClone--) {
            if (extractedCloneChars.chars[endClone] !== extractedChars.chars[length + endClone - cloneLength]) {
                endClone++;
                end = length + endClone - cloneLength;
                break;
            }
        }

        return {
            startClone: startClone,
            endClone: endClone,
            start: start,
            end: end,
        };
    }
    /**
     * Move the current range to the current selection in the DOM
     * (the native range).
     *
     * @returns {Range}
     */
    _getRange (): Range {
        const selection = this.editable.ownerDocument.getSelection();
        if (!selection || selection.rangeCount === 0) {
            const range: Range = {
                startContainer: this.editable,
                startOffset: 0,
                endContainer: this.editable,
                endOffset: 0,
                direction: 'rtl',
            };
            return range;
        }
        const nativeRange = selection.getRangeAt(0);
        let ltr: boolean;
        if (selection.anchorNode === selection.focusNode) {
            ltr = selection.anchorOffset <= selection.focusOffset;
        } else {
            ltr = selection.anchorNode === nativeRange.startContainer;
        }
        const range: Range = {
            startContainer: nativeRange.startContainer,
            startOffset: nativeRange.startOffset,
            endContainer: nativeRange.endContainer,
            endOffset: nativeRange.endOffset,
            direction: ltr ? 'ltr' : 'rtl',
        };
        return range;
    }
    _isSelectAll (rangeDOM: Range) {
        let startContainer = rangeDOM.startContainer;
        let startOffset = rangeDOM.startOffset;
        let endContainer = rangeDOM.endContainer;
        let endOffset = rangeDOM.endOffset;

        const isRangeCollapsed = startContainer === endContainer && startOffset === endOffset;
        if (!startContainer || !endContainer || isRangeCollapsed) {
            return false;
        }

        const body = this.editable.ownerDocument.body;
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

        function isVisible (el: DOMElement): boolean {
            if (el.tagName === 'WE3-EDITABLE') {
                return true;
            }
            const style = window.getComputedStyle(el.parentNode);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
            return isVisible(el.parentNode);
        }

        let el: DOMElement;
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
     * @param {string} param
     */
    _pressInsertChar (param: CompiledEvent) {
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
        if (!this.editable.contains(param.clone.origin)) {
            this.triggerEvent('trigger Action: ??? wtf ???');
            return;
        }

        const cloneTextNodes = this._findTextNode(param.clone);
        const extractedCloneChars = this._extractChars(cloneTextNodes);

        const textNodes = this._findTextNode(param.clone.origin);
        const extractedChars = this._extractChars(textNodes);

        const originChanges = this._findOriginChanges(extractedCloneChars, extractedChars);
        let text = param.data && param.data.replace(/\u00A0/g, ' ') || '';

        // specify the change from the range and data

        const range = this._getRange();
        const cloneLength = extractedCloneChars.nodes.length;
        const length = extractedChars.nodes.length;
        let endChanged;
        for (let index = 0, ; index <= length; index++) {
            if (extractedChars.nodes[index] === range.startContainer) {
                endChanged = index + range.startOffset;
                break;
            }
        }
        let startChanged = endChanged - text.length;

        endChanged = Math.max(endChanged, Math.min(originChanges.start, originChanges.end));
        startChanged = Math.min(startChanged, Math.max(originChanges.start, originChanges.end));
        text = extractedChars.chars.slice(startChanged, endChanged).join('');

        let origin = {
            startContainer: extractedCloneChars.nodes[startChanged].origin,
            startOffset: extractedCloneChars.offsets[startChanged],
            endContainer: extractedCloneChars.nodes[cloneLength - length + endChanged].origin,
            endOffset: extractedCloneChars.offsets[cloneLength - length + endChanged],
        };
        let textBefore = extractedCloneChars.nodes[startChanged].nodeValue.slice(0, origin.endOffset).slice(origin.startOffset);

        // end

        this.triggerEvent('trigger Action: setRange', origin, textBefore);
        this.triggerEvent('trigger Action: insert', text);
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertEnter (param: CompiledEvent) {
        if (param.shiftKey) {
            this.triggerEvent('trigger Action: insert', ['<br/>']);
        } else {
            this.triggerEvent('trigger Action: enter, or outdent');

            /*
            const range = BaseRange.getRange();
            const liAncestor = range.scArch.ancestor('isLi');
            const isInEmptyLi = range.isCollapsed() && liAncestor && liAncestor.isDeepEmpty();
            if (isInEmptyLi) {
                BaseArch.outdent();
            } else {
                BaseArch.addLine();
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
    _pressInsertTab(param: CompiledEvent) {
        if (this.options.tab && !this.options.tab.enabled) {
            this.triggerEvent('trigger Action: nothing');
            return;
        }
        if (param.shiftKey || param.ctrlKey || param.altKey) {
            this.triggerEvent('trigger Action: nothing');
            return;
        }
        const tabSize = this.options.tab && this.options.tab.size || 0;
        const tab = new Array(tabSize).fill('\u00A0').join('');

        this.triggerEvent('trigger Action: insert', [tab]);
    }
    _pressMove (param: CompiledEvent) {
        if (param.defaultPrevented) {
            this.triggerEvent('trigger Action: restore range');
        }
        if (param.data === 'SelectAll') {
            this.triggerEvent('trigger Action: selectAll');
        } else if (navigationKey.indexOf(param.data) !== -1) {
            const isLeftish = ['ArrowUp', 'ArrowLeft', 'PageUp', 'Home'].indexOf(param.data) !== -1;
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
    _pressRemoveSide (param: CompiledEvent) {
        this.triggerEvent('trigger Action: remove', param.key === 'Backspace' ? 'left' : 'right', param);
    }
    _tickAfterUserInteraction () {
        const param = this._compiledEvent;
        param.previous = this._previousEvent;
        this._previousEvent = param;
        this._compiledEvent = null;
        this._eventsNormalization(param);
    }
    triggerEvent (truc: string, a: any = null, b: any = null) {
        console.log(truc, a, b);
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} event
     */
    _onCompositionEnd(event: CompositionEvent) {
        if (this.editable.style.display === 'none') {
            return;
        }
        const param = this._beginToStackEventDataForNextTick();
        this._cloneForComposition();
        param.type = 'composition';
        param.update = false;
        param.data = event.data;
    }
    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} event
     */
    _onCompositionStart (event: CompositionEvent) {
        if (this.editable.style.display !== 'none') {
            this._beginToStackEventDataForNextTick();
            this._cloneForComposition();
        }
    }
    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} event
     */
    _onCompositionUpdate (event: CompositionEvent) {
        if (this.editable.style.display !== 'none') {
            this._beginToStackEventDataForNextTick();
            this._cloneForComposition();
        }
    }
    /**
     * Catch setRange, setRangeFromDom and selectAll actions
     *
     * @private
     * @param {MouseEvent} event
     */
    _onContextMenu (event: MouseEvent) {
        this._mousedownInEditable = false;
    }
    /**
     * Catch composition, Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {InputEvent} event
     */
    _onInput (event: InputEvent) {
        if (this.editable.style.display === 'none') {
            return;
        }
        const param = this._beginToStackEventDataForNextTick();

        if (!param.type) {
            param.type = event.type;
            param.data = event.data;
        }

        // todo: delete word <=> composition

        if (event.inputType === 'insertCompositionText' || event.inputType === 'insertReplacementText') {
            param.update = param.update || param.type !== 'composition';
            param.type = 'composition';
            param.data = event.data;
            this._cloneForComposition();
        } else if (event.inputType === 'insertParagraph' && param.key === 'Unidentified') {
            param.key = 'Enter';
        } else if (event.inputType === 'deleteContentBackwards' && param.key === 'Unidentified') {
            param.key = 'Backspace';
        } else if (event.inputType === 'deleteContentForward' && param.key === 'Unidentified') {
            param.key = 'Delete';
        } else if (!param.data) {
            param.data = event.data;
        } else if (event.inputType === "insertText") {
            if (param.type.indexOf('key') === 0 && param.key.length === 1 && event.data.length === 1) {
                param.key = event.data; // keep accent
            } else if (event.data && event.data.length === 1 && event.data !== param.data && param.type === 'composition') {
                this._cloneForComposition();
                // swiftKey add automatically a space after the composition, without this line the arch is correct but not the range
                param.data += event.data;
            } else if (param.key === 'Unidentified') {
                param.key = event.data;
            }
        }
    }
    /**
     * Catch Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {KeyboardEvent} event
     */
    _onKeyDown (event: KeyboardEvent) {
        if (this.editable.style.display === 'none') {
            return;
        }
        if (event.type === 'keydown' && event.key === 'Dead') {
            return;
        }
        const param = this._beginToStackEventDataForNextTick();
        param.defaultPrevented = param.defaultPrevented || event.defaultPrevented;
        param.type = param.type || event.type;
        param.shiftKey = event.shiftKey;
        param.ctrlKey = event.ctrlKey;
        param.altKey = event.altKey;
        param.key = event.key;
    }
    /**
     * Catch setRange, setRangeFromDom and selectAll actions
     *
     * @private
     * @param {MouseEvent} event
     */
    _onMouseDown (event: MouseEvent) {
        this._previousEvent = null;
        this._mousedownInEditable = event;
    }
    /**
     * Catch setRange, setRangeFromDom actions
     * After a tick (setTimeout 0) to have the new selection/range in the DOM
     *
     * @see __onClick
     * @private
     * @param {MouseEvent} event
     */
    _onClick (event: MouseEvent) {
        if (!this._mousedownInEditable) {
            return;
        }
        const mousedownTarget = this._mousedownInEditable.target;
        const target = event.target;
        setTimeout(() => {
            this._mousedownInEditable = false;
            if (!(target instanceof Element)) {
                return;
            }
            if (this.editor.contains(target) && this.editable !== target && !this.editable.contains(target)) {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.triggerEvent('trigger Action: restore range');
                    return;
                }
            }
            if (mousedownTarget === target) {
                this.triggerEvent('trigger Action: setRange', {startContainer: target});
            } else {
                this.triggerEvent('trigger Action: setRangeFromDom');
            }
        }, 0);
    }
    /**
     * Catch selectAll action
     *
     * @private
     * @param {Event} event
     */
    _onSelectionChange (event: Event) {
        if (!this._editorFocused || this._mousedownInEditable || this.editable.style.display === 'none') {
            return;
        }
        if (this._isSelectAll(this._getRange())) {
            this.triggerEvent('trigger Action: selectAll');
        }
    }
};
