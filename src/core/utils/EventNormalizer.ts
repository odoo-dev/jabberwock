import { Range } from '../stores/Range.js';
import { DOMElement } from '../types/DOMElement.js';

const navigationKey = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'End', 'Home']);

// As of August 29th 2019, InputEvent is considered experimental by MDN as some
// of its properties are said to be unsupported by Edge and Safari. This is
// probably the reason why its type definition is not included in the basic
// TypeScript distribution. However, these properties actually appear to be
// working perfectly fine on these browser after some manual testing on MacOS.
interface InputEvent extends UIEvent {
    readonly data: string;
    readonly dataTransfer: DataTransfer;
    readonly inputType: string;
    readonly isComposing: boolean;
}

interface CompiledEvent {
    type: string; // main event type, e.g. 'keydown', 'composition', 'move', ...
    key?: string; // the key pressed for keyboard events
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    data?: string; // specific data for input events
    mutationsList?: Array<MutationRecord>; // mutations observed by the observer
    defaultPrevented?: boolean;
    clone?: ClonedNode; // clone of closest block node containing modified selection during composition
}

interface EventFunctionMapping {
    [keyof: string]: EventListener;
}

interface ClonedNode extends DOMElement {
    origin: DOMElement;
}

interface SelectRange extends Range {
    origin: string;
}

interface ExtractedCharList {
    chars: string[];
    nodes: ClonedNode[];
    offsets: number[];
}

interface ChangeOffsets {
    cloneStart: number;
    cloneEnd: number;
    originalStart: number;
    originalEnd: number;
}

export class EventNormalizer {
    editable: DOMElement;
    _compiledEvent: CompiledEvent;
    _observer: MutationObserver;
    _selectAllOriginElement: DOMElement; // original selection/target before updating selection
    _mousedownInEditable: MouseEvent; // original mousedown event when starting selection in editable zone
    _triggerEvent: Function; // callback to trigger on events
    _rangeHasChanged: boolean;

    constructor(editable: HTMLElement, triggerEvent: Function) {
        this.editable = editable as DOMElement;
        this._triggerEvent = triggerEvent;

        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onKeyDownOrKeyPress = this._onKeyDownOrKeyPress.bind(this);
        this._onInput = this._onInput.bind(this);
        this._onCompositionEnd = this._onCompositionEnd.bind(this);
        this._onCompositionStart = this._onCompositionStart.bind(this);
        this._onCompositionUpdate = this._onCompositionUpdate.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);

        window.top.document.addEventListener('selectionchange', this._onSelectionChange, false);
        window.top.document.addEventListener('click', this._onClick, false);
        window.top.document.addEventListener('touchend', this._onClick, false);
        window.top.document.addEventListener('contextmenu', this._onContextMenu, false);

        this.editable.addEventListener('keydown', this._onKeyDownOrKeyPress, false);
        this.editable.addEventListener('keypress', this._onKeyDownOrKeyPress, false);
        this.editable.addEventListener('input', this._onInput, false);
        this.editable.addEventListener('compositionend', this._onCompositionEnd, false);
        this.editable.addEventListener('compositionstart', this._onCompositionStart, false);
        this.editable.addEventListener('compositionupdate', this._onCompositionUpdate, false);
        this.editable.addEventListener('mousedown', this._onMouseDown, false);
        this.editable.addEventListener('touchstart', this._onMouseDown, false);

        this._observer = new MutationObserver((mutationsList: Array<MutationRecord>): void => {
            if (this._compiledEvent) {
                this._compiledEvent.mutationsList = this._compiledEvent.mutationsList.concat(mutationsList);
            }
        });
        this._observer.observe(this.editable, {
            characterData: true, // text changes
            childList: true, // child changes
            subtree: true, // extend the obervation to the target children
        });
    }
    /**
     * Called when destroy the event normalizer.
     * Remove all added handlers.
     *
     */
    destroy(): void {
        this._observer.disconnect();

        window.top.document.removeEventListener('selectionchange', this._onSelectionChange);
        window.top.document.removeEventListener('click', this._onClick);
        window.top.document.removeEventListener('touchend', this._onClick);
        window.top.document.removeEventListener('contextmenu', this._onContextMenu);

        this.editable.removeEventListener('keydown', this._onKeyDownOrKeyPress);
        this.editable.removeEventListener('keypress', this._onKeyDownOrKeyPress);
        this.editable.removeEventListener('input', this._onInput);
        this.editable.removeEventListener('compositionend', this._onCompositionEnd);
        this.editable.removeEventListener('compositionstart', this._onCompositionStart);
        this.editable.removeEventListener('compositionupdate', this._onCompositionUpdate);
        this.editable.removeEventListener('mousedown', this._onMouseDown);
        this.editable.removeEventListener('touchstart', this._onMouseDown);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * This method is called by each event handler and create a CompiledEvent.
     * After a tick (setTimeout 0ms) the method '_tickAfterUserInteraction' is
     * called.
     * All events during a tick are caught and the CompiledEvent object is
     * complete. This analysis tries to extract the actions desired by the user.
     * Actions such as special character insertion, delete, backspace,
     * spellcheckers...
     * User events are received per batch, corresponding to an action.
     *
     * @see _tickAfterUserInteraction
     * @returns {CompiledEvent}
     */
    _beginToStackEventDataForNextTick(): CompiledEvent {
        if (this._compiledEvent) {
            return this._compiledEvent;
        }
        this._rangeHasChanged = false;
        this._compiledEvent = {
            type: null,
            key: 'Unidentified',
            data: '',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            mutationsList: [],
            defaultPrevented: false,
        };
        setTimeout(this._tickAfterUserInteraction.bind(this));
        return this._compiledEvent;
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
    _cloneForComposition(): void {
        // Check if already cloned earlier
        if (this._compiledEvent.clone) {
            return;
        }

        const range = this._getRange();
        // Look for closest block node starting from current text node
        let format = range.startContainer;
        while (
            format.parentNode &&
            format !== this.editable &&
            (format.nodeType === 3 || // text node can't be block => look for parent
                window.getComputedStyle(format).display !== 'block')
        ) {
            format = format.parentNode;
        }
        const clone: ClonedNode = format.cloneNode(true);
        clone.origin = format;
        this._compiledEvent.clone = clone;

        (function addChildOrigin(clone: ClonedNode): void {
            // only mark DOM elements (type 1)
            if (clone.nodeType !== 1) {
                return;
            }
            const childNodes = clone.origin.childNodes as NodeListOf<DOMElement>;
            clone.childNodes.forEach((child: ClonedNode, index) => {
                child.origin = childNodes[index];
                addChildOrigin(child);
            });
        })(clone);
    }
    /**
     * Called when the CompiledEvent is ready by _tickAfterUserInteraction
     * Trigger the different actions according to the event analysis performed.
     *
     * @see _tickAfterUserInteraction
     * @private
     * @compiledEvent {CompiledEvent} compiledEvent
     */
    _processCompiledEvent(compiledEvent: CompiledEvent): void {
        // TODO: transfer defaultPrevented information
        if (compiledEvent.defaultPrevented) {
            this._triggerEvent('nothing'); // suggest a flush / reset from editor
            return;
        }

        // gather dirty nodes as they will have to be re-rendered
        const elements: Set<HTMLElement> = new Set();
        compiledEvent.mutationsList.forEach(mutation => {
            if (mutation.type === 'characterData') {
                elements.add(mutation.target as HTMLElement);
            }
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(target => elements.add(target as HTMLElement));
                mutation.removedNodes.forEach(target => elements.add(target as HTMLElement));
            }
        });

        if (navigationKey.has(compiledEvent.key)) {
            this._pressMove(compiledEvent, elements);
        } else if (compiledEvent.type === 'composition') {
            this._pressInsertComposition(compiledEvent, elements);
        } else if (compiledEvent.key === 'Backspace' || compiledEvent.key === 'Delete') {
            const deleteEventPayload = {
                direction: compiledEvent.key === 'Backspace' ? 'left' : 'right',
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
            };
            this._triggerEvent('delete', deleteEventPayload, elements);
        } else if (compiledEvent.key === 'Tab') {
            const tabEventPayload = {
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
            };
            this._triggerEvent('tab', tabEventPayload, elements);
        } else if (compiledEvent.key === 'Enter') {
            const enterEventPayload = {
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
            };
            this._triggerEvent('enter', enterEventPayload, elements);
        } else if (
            !compiledEvent.ctrlKey &&
            !compiledEvent.altKey &&
            ((compiledEvent.data && compiledEvent.data.length === 1) ||
                (compiledEvent.key && compiledEvent.key.length === 1) ||
                compiledEvent.key === 'Space')
        ) {
            // Different browsers handle the same action differently using
            // triggering different events with different payloads. We listen
            // to input events which uses data and keypress event which uses key.
            // In some browsers, input event data is empty (empty string) which
            // is wrong, hence we have to look at the keypress event.
            // When we have data, data has more value than key.
            // TODO comment: input > keypress > keydown
            const data = compiledEvent.data && compiledEvent.data.length === 1 ? compiledEvent.data : compiledEvent.key;
            if (data === ' ' || data === 'Space') {
                // Some send space as ' ' and some send 'Space'.
                this._triggerEvent('insert', '\u00A0', elements); // nbsp
            } else if (data.charCodeAt(0) === 10) {
                // enter on some mobile keyboards do not trigger keypress so we need to catch it here
                this._triggerEvent('insert', '<br/>', elements);
            } else {
                this._triggerEvent('insert', data, elements);
            }
        } else if (compiledEvent.type === 'keydown') {
            this._triggerEvent('keydown', compiledEvent);
        } else {
            this._triggerEvent('unknown', compiledEvent);
        }
    }
    /**
     * Convert a node list of node into a list of char linked to an element
     * and offset.
     * Two lists can then be compared to know where they diverge.
     *
     * @private
     * @param {Element[]} nodesToExtract text nodes or <br/> nodes
     * @returns {Object} {chars, nodes, offsets}
     */
    _extractChars(node: Element): ExtractedCharList {
        const nodesToExtract = this._findTextNode(node as DOMElement);
        const chars: Array<string> = [];
        const nodes: Array<Element> = [];
        const offsets: Array<number> = [];
        nodesToExtract.forEach(function(node) {
            if (node.nodeValue) {
                node.nodeValue.split('').forEach(function(char, index) {
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
            nodes: nodes as ClonedNode[],
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
    _findTextNode(node: DOMElement, textNodes: Array<Element> = []): Element[] {
        if (node.nodeType === 3) {
            textNodes.push(node);
        } else if (node.tagName === 'BR') {
            textNodes.push(node);
        } else {
            node.childNodes.forEach(n => this._findTextNode(n as DOMElement, textNodes));
        }
        return textNodes;
    }
    /**
     * Compare to extracted list of char to define the start and the end
     * of the changes. Return the indexes from each list.
     *
     * @see _extractChars
     * @private
     * @param {Object} cloneChars
     * @param {Object} originalChars
     * @returns {Object} {startClone, endClone, start, end}
     */
    _findChangeOffsets(cloneChars: ExtractedCharList, originalChars: ExtractedCharList): ChangeOffsets {
        const cloneLength = cloneChars.chars.length - 1;
        const originalLength = originalChars.chars.length - 1;

        let cloneStart = 0;
        let cloneEnd = cloneLength;
        let originalStart = 0;
        let originalEnd = originalLength;

        for (originalStart; originalStart <= cloneLength; originalStart++) {
            if (cloneChars.chars[originalStart] !== originalChars.chars[originalStart]) {
                cloneStart = originalStart;
                break;
            }
        }

        for (cloneEnd; cloneEnd >= 0; cloneEnd--) {
            if (cloneChars.chars[cloneEnd] !== originalChars.chars[originalLength + cloneEnd - cloneLength]) {
                cloneEnd = cloneEnd + 1; // end of range is inclusive
                originalEnd = originalLength + cloneEnd - cloneLength;
                break;
            }
        }

        return {
            cloneStart: cloneStart,
            cloneEnd: cloneEnd,
            originalStart: originalStart,
            originalEnd: originalEnd,
        };
    }
    /**
     * Get the current range and selection from the DOM
     *
     * @returns {Range}
     */
    _getRange(): Range {
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
    _isSelectAll(rangeDOM: Range): boolean {
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
            // The selection might be in a node which has since been removed from DOM
            return false;
        }
        if (startContainer.childNodes[startOffset]) {
            startContainer = startContainer.childNodes[startOffset];
            startOffset = 0;
        }
        if (endContainer.childNodes[endOffset]) {
            endContainer = endContainer.childNodes[endOffset];
            endOffset = 0;
        }
        if (startOffset !== 0 || (endContainer.nodeType === 3 && endOffset !== endContainer.textContent.length)) {
            return false;
        }

        const editable = this.editable;
        function isVisible(el: DOMElement): boolean {
            if (el === editable) {
                return true;
            }
            const style = window.getComputedStyle(el.parentNode);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
            return isVisible(el.parentNode);
        }

        // Look for nodes in editable that would be before startContainer
        if (this.editable.contains(startContainer)) {
            let el = this.editable;
            while (el) {
                if (el === startContainer) {
                    break;
                }
                if ((el.nodeType === 3 || el.tagName === 'BR') && isVisible(el)) {
                    // We found a node in editable before startContainer so,
                    // clearly, we did not do a select all
                    return false;
                }
                if (el.firstChild) {
                    el = el.firstChild;
                } else if (el.nextSibling) {
                    el = el.nextSibling;
                } else if (el.parentNode !== this.editable) {
                    el = el.parentNode.nextSibling;
                } else {
                    // We looked at all the nodes in editable
                    break;
                }
            }
        }

        if (this.editable.contains(endContainer)) {
            let el = this.editable;
            while (el) {
                if (el === endContainer) {
                    break;
                }
                if (
                    (el.nodeType === 3 || (el.tagName === 'BR' && (el.nextSibling || !el.previousSibling))) &&
                    isVisible(el)
                ) {
                    // br is not selected if it's the last element and is not alone
                    // We found a node in editable before startContainer so,
                    // clearly, we did not do a select all
                    return false;
                }
                if (el.lastChild) {
                    el = el.lastChild;
                } else if (el.previousSibling) {
                    el = el.previousSibling;
                } else if (el.parentNode !== this.editable) {
                    el = el.parentNode.previousSibling;
                } else {
                    // We looked at all the nodes in editable
                    break;
                }
            }
        }
        return true;
    }
    /**
     * @private
     * @param {object} param
     */
    _pressInsertComposition(param: CompiledEvent, elements: Set<HTMLElement>): void {
        if (!this.editable.contains(param.clone.origin)) {
            // Some weird keyboards might replace the entire block element rather
            // than the text inside of it. This is currently unsupported.
            this._triggerEvent('unknown', param, elements); // suggest reset / flush from renderer
            return;
        }

        const extractedCloneChars = this._extractChars(param.clone);
        const extractedOriginalChars = this._extractChars(param.clone.origin);
        const changeOffsets = this._findChangeOffsets(extractedCloneChars, extractedOriginalChars);

        // extend the range of the change to match the text that was inserted
        // example:
        // original: 'this is a sentance'
        // word corrected by the system: sentance => sentence
        // new: 'this is a sentence'
        // change we observe: 'this is a sent[a => e]nce'
        // We want to find back the proper corrected word, not just the change
        const range = this._getRange();
        const cloneLength = extractedCloneChars.chars.length;
        const originalLength = extractedOriginalChars.chars.length;
        let endChanged: number;
        // Extend the change offset up to the current position of therange, which
        // is necessarily right after the change after a correction.
        for (let index = 0; index <= originalLength; index++) {
            if (extractedOriginalChars.nodes[index] === range.startContainer) {
                endChanged = index + range.startOffset;
                break;
            }
        }
        // If we have data, we know the length of the corrected word, so we can
        // construct the range offsets by going backward from the end we just got
        let startChanged = param.data ? endChanged - param.data.length : endChanged;

        // TODO: original => new, cloned => old
        // The offsets of the change might have endChanged < startChanged if
        // original: 'aa aa aa aa aa'
        // new:      'aa aa aa aa aa aa'
        // change we observe: 'aa] aa aa aa aa [aa'
        // We use min max to find the first offset, regardless of whether it's
        // supposed to be the start or end offset then use min/max to avoid
        // restraining the endChanged and startChanged computed earlier. It's ok
        // to extend the range firther with this second analysis but not restrain
        // it. We have the assurance to have AT LEAST the change in the range.
        endChanged = Math.max(endChanged, Math.min(changeOffsets.originalStart, changeOffsets.originalEnd));
        startChanged = Math.min(startChanged, Math.max(changeOffsets.originalStart, changeOffsets.originalEnd));

        // Reconstruct the correction
        const text = extractedOriginalChars.chars.slice(startChanged, endChanged).join('');
        // Compute the range in old DOM corresponding to range of the correction in new DOM
        const origin: SelectRange = {
            startContainer: extractedCloneChars.nodes[startChanged].origin,
            startOffset: extractedCloneChars.offsets[startChanged],
            endContainer: extractedCloneChars.nodes[cloneLength - originalLength + endChanged].origin,
            endOffset: extractedCloneChars.offsets[cloneLength - originalLength + endChanged],
            direction: 'rtl',
            origin: 'composition',
        };

        // We can get the original text before composition if we would like to
        // const textBefore = extractedCloneChars.nodes[startChanged].nodeValue
        //     .slice(0, origin.endOffset)
        //     .slice(origin.startOffset);

        this._triggerEvent('setRange', origin, []);
        this._triggerEvent('insert', text, elements);
    }
    /**
     * Move the selection/range
     *
     * @private
     * @param {object} param
     */
    _pressMove(param: CompiledEvent, elements: Set<HTMLElement>): void {
        if (param.defaultPrevented) {
            this._triggerEvent('restoreRange');
        }
        const range = this._getRange() as SelectRange;
        range.origin = param.key;
        this._triggerEvent('setRange', range, elements);
    }
    /**
     * Called when the CompiledEvent is ready, that is when all events have
     * been received and the event thread is finished then process the CompiledEvent.
     *
     * @see _beginToStackEventDataForNextTick
     * @see _eventsNormalization
     */
    _tickAfterUserInteraction(): void {
        const param = this._compiledEvent;
        this._compiledEvent = null;
        this._processCompiledEvent(param);
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} ev
     */
    _onCompositionStart(): void {
        // Consider a spell checking keyboard that is being displayed following
        // a focus event into the editable zone. If some other code on the page
        // ends up hiding the editable zone for some functional reason, there is
        // no guarantee the spell checking keyboard will be updated accordingly.
        // In this case, if the user goes on to click on one of the proposition
        // from his spell checking keyboard, it will trigger a CompositionEvent
        // but, since the editable zone has since been hidden, we ignore it.
        if (this.editable.style.display === 'none') return;
        // TODO: what if we got detached from the DOM (beware of iframes) ?

        // Initialize the CompiledEvent and clone the current block node to be
        // able to analyze the change later on to reconstruct the composition.
        this._beginToStackEventDataForNextTick();
        this._cloneForComposition();
    }
    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} ev
     */
    _onCompositionUpdate(ev: CompositionEvent): void {
        // See comment on the same line in _onCompositionStart handler.
        if (this.editable.style.display === 'none') return;

        // Spell checking keyboards handle composition events inconsistently.
        // Because of this, we cannot count on compositionstart being triggered
        // before compositionupdate, so we might want to start compiling events
        // on a compositionupdate event.
        const compiledEvent = this._beginToStackEventDataForNextTick();
        this._cloneForComposition();

        // At least we have some data in the compositionupdate event.
        compiledEvent.type = 'composition';
        compiledEvent.data = ev.data;
    }
    /**
     * Catch composition action
     *
     * @private
     * @param {CompositionEvent} ev
     */
    _onCompositionEnd(ev: CompositionEvent): void {
        // See comment on the same line in _onCompositionStart handler.
        if (this.editable.style.display === 'none') return;

        // Spell checking keyboards handle composition events inconsistently.
        // Because of this, we cannot count on either start or update events
        // occuring before the end one, so we might want to start compiling
        // events on a compositionend event.
        const compiledEvent = this._beginToStackEventDataForNextTick();
        this._cloneForComposition();

        // At least, we have some data in the compositionend event.
        compiledEvent.type = 'composition';
        compiledEvent.data = ev.data;
    }
    /**
     * Catch setRange and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onContextMenu(): void {
        // The _mousedownInEditable property is used to assess whether the user
        // is currently changing the selection by using the mouse. If the
        // context menu ends up opening, the user is definitely not selecting.
        this._mousedownInEditable = null;
    }
    /**
     * Catch composition, Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {InputEvent} ev
     */
    _onInput(ev: InputEvent): void {
        // See comment on the same line in _onCompositionStart handler.
        if (this.editable.style.display === 'none') return;

        const compiledEvent = this._beginToStackEventDataForNextTick();

        // TODO comment: insert input data has more value than any other event
        // type, but 'input' type has nearly no value since we don't know if it's
        // a composition or something else, so we want to keep the original type
        // but use the data from the input event.
        if (!compiledEvent.type) {
            compiledEvent.type = ev.type;
            compiledEvent.data = ev.data;
        }

        if (
            (ev.inputType === 'insertCompositionText' || ev.inputType === 'insertReplacementText') &&
            compiledEvent.type === 'composition'
        ) {
            // TODO comment: sometimes data won't be in compositionend (or it won't be triggered at all)
            // so, if we can catch this one, let's use it instead
            compiledEvent.type = 'composition';
            compiledEvent.data = ev.data;
            this._cloneForComposition();
        } else if (ev.inputType === 'insertParagraph' && compiledEvent.key === 'Unidentified') {
            compiledEvent.key = 'Enter';
        } else if (ev.inputType === 'deleteContentBackward' && compiledEvent.key === 'Unidentified') {
            compiledEvent.key = 'Backspace';
            // TODO comment: safari mac for accents
            this._cloneForComposition();
        } else if (ev.inputType === 'deleteContentForward' && compiledEvent.key === 'Unidentified') {
            compiledEvent.key = 'Delete';
        } else if (ev.inputType === 'insertText') {
            // update the key which does not have the accent with the data which contains the accent
            if (compiledEvent.type.indexOf('key') === 0 && compiledEvent.key.length === 1 && ev.data.length === 1) {
                compiledEvent.key = ev.data; // keep accent
            } else if (
                ev.data &&
                ev.data.length === 1 &&
                ev.data !== compiledEvent.data &&
                compiledEvent.type === 'composition'
            ) {
                // swiftKey add automatically a space after the composition, without this line the arch is correct but not the range
                // remember that ev.data and compiledEvent.data are from the same event stack !
                compiledEvent.data += ev.data;
            } else if (compiledEvent.key === 'Unidentified') {
                // data contains the accentuated character, which is an "Unidentified" key for some browsers so let's update the key
                compiledEvent.key = ev.data;
            }
        } else if (!compiledEvent.data) {
            // TODO comment: input data > other events data
            compiledEvent.data = ev.data;
        }
    }
    /**
     * Catch Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {KeyboardEvent} ev
     */
    _onKeyDownOrKeyPress(ev: KeyboardEvent): void {
        this._selectAllOriginElement = this._getRange().startContainer;

        // See comment on the same line in _onCompositionStart handler.
        if (this.editable.style.display === 'none') return;

        // Dead keys will trigger composition and input events later
        if (ev.type === 'keydown' && ev.key === 'Dead') return;

        const compiledEvent = this._beginToStackEventDataForNextTick();
        compiledEvent.defaultPrevented = compiledEvent.defaultPrevented || ev.defaultPrevented;
        compiledEvent.type = compiledEvent.type || ev.type;
        compiledEvent.key = ev.key;
        compiledEvent.altKey = ev.altKey;
        compiledEvent.ctrlKey = ev.ctrlKey;
        compiledEvent.metaKey = ev.metaKey;
        compiledEvent.shiftKey = ev.shiftKey;
    }
    /**
     * Catch setRange and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onMouseDown(ev: MouseEvent): void {
        this._rangeHasChanged = false;
        // store mousedown event to detect range change from mouse selection
        this._mousedownInEditable = ev;
        this._selectAllOriginElement = ev.target as DOMElement;
        setTimeout(() => {
            this._selectAllOriginElement = this._getRange().startContainer;
        }, 0);
    }
    /**
     * Catch setRange actions
     * After a tick (setTimeout 0) to have the new selection/range in the DOM
     *
     * @see __onClick
     * @private
     * @param {MouseEvent} ev
     */
    _onClick(ev: MouseEvent): void {
        if (!this._mousedownInEditable) {
            return;
        }
        setTimeout(() => {
            this._selectAllOriginElement = ev.target as DOMElement;
            const target = this._mousedownInEditable.target as Element;
            this._mousedownInEditable = null;
            if (ev.target instanceof Element) {
                let range: SelectRange;
                if (target === ev.target) {
                    range = {
                        startContainer: target,
                        startOffset: 0,
                        endContainer: target,
                        endOffset: target.nodeType === 1 ? target.childNodes.length : target.nodeValue.length,
                        direction: 'rtl',
                        origin: 'pointer',
                    };
                } else {
                    range = this._getRange() as SelectRange;
                    range.origin = 'pointer';
                }
                if (this._rangeHasChanged) {
                    this._triggerEvent('setRange', range);
                }
            }
        }, 0);
    }
    /**
     * Catch selectAll action
     *
     * @private
     * @param {Event} ev
     */
    _onSelectionChange(): void {
        this._rangeHasChanged = true;
        // do nothing, wait for mouseup !
        if (this._mousedownInEditable || this.editable.style.display === 'none') {
            return;
        }
        if ((!this._compiledEvent || this._compiledEvent.key === 'a') && this._isSelectAll(this._getRange())) {
            this._triggerEvent('selectAll', {
                origin: this._compiledEvent ? 'keypress' : 'pointer',
                target: this._selectAllOriginElement,
            });
        }
    }
}
