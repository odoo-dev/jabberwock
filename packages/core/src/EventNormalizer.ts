const navigationKey = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'PageUp',
    'PageDown',
    'End',
    'Home',
]);

export interface DomSelection {
    readonly anchorNode: Node;
    readonly anchorOffset: number;
    readonly focusNode: Node;
    readonly focusOffset: number;
    origin?: string; // origin of the selection change
}

interface CompiledEvent {
    type: string; // main event type, e.g. 'keydown', 'composition', 'move', ...
    key?: string; // the key pressed for keyboard events
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    data?: string; // specific data for input events
    elements?: Set<HTMLElement>; // the nodes that were mutated, if any
    mutationsList?: Array<MutationRecord>; // mutations observed by the observer
    defaultPrevented?: boolean;
    clone?: ClonedNode; // clone of closest block node containing modified selection during composition
}

interface ClonedNode extends Node {
    origin: Node;
}

interface CharactersMapping {
    length: number;
    chars: string; // concatenated characters accross multiple nodes
    nodes: Array<Node | ClonedNode>; // corresponding textual nodes
    offsets: number[]; // character offsets in their corresponding textual nodes
}

interface ChangeOffsets {
    leftOffset: number;
    rightOffset: number;
}

interface EventListenerDeclaration {
    readonly target: EventTarget;
    readonly type: string;
    readonly listener: EventListener;
}

interface NormalizedventPayload {
    domSelectionChange?: DomSelection;

    origin: string;
}

export class EventNormalizer {
    editable: HTMLElement;
    _eventListeners: EventListenerDeclaration[] = [];
    _compiledEvent: CompiledEvent;
    _observer: MutationObserver;
    _selectAllOriginElement: Node; // original selection/target before updating selection
    _mousedownInEditable: MouseEvent; // original mousedown event when starting selection in editable zone
    _eventCallback: (customEvent: CustomEvent) => void; // callback to trigger on events
    _selectionHasChanged: boolean;
    _selectAll: boolean;

    constructor(editable: HTMLElement, eventCallback: (customEvent: CustomEvent) => void) {
        this.editable = editable;
        this._eventCallback = eventCallback;

        const document = this.editable.ownerDocument;
        this._bindEvent(document, 'selectionchange', this._onSelectionChange);
        this._bindEvent(document, 'click', this._onClick);
        this._bindEvent(document, 'touchend', this._onClick);
        this._bindEvent(document, 'contextmenu', this._onContextMenu);

        this._bindEvent(editable, 'keydown', this._onKeyDownOrKeyPress);
        this._bindEvent(editable, 'keypress', this._onKeyDownOrKeyPress);
        this._bindEvent(editable, 'input', this._onInput);
        this._bindEvent(editable, 'compositionstart', this._onComposition);
        this._bindEvent(editable, 'compositionupdate', this._onComposition);
        this._bindEvent(editable, 'compositionend', this._onComposition);
        this._bindEvent(editable, 'touchstart', this._onMouseDown);
        this._bindEvent(editable, 'mousedown', this._onMouseDown);

        this._observer = new MutationObserver((mutationsList): void => {
            if (this._compiledEvent) {
                this._compiledEvent.mutationsList.push(...mutationsList);
            }
        });
        this._observer.observe(this.editable, {
            characterData: true, // monitor text content changes
            childList: true, // monitor child nodes addition or removal
            subtree: true, // extend monitoring to all children of the target
        });
    }
    /**
     * Called when destroy the event normalizer.
     * Remove all added handlers.
     *
     */
    destroy(): void {
        this._observer.disconnect();
        this._unbindEvents();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Bind the occurence of given even type on the given target element to the
     * given listener function. See _unbindEvents to unbind all events bound by
     * calling this function.
     *
     * @private
     * @param target element on which to listen for events
     * @param type of the event to listen
     * @param listener to call when the even occurs on the target
     */
    _bindEvent(target: EventTarget, type: string, listener: Function): void {
        const boundListener = listener.bind(this);
        this._eventListeners.push({
            target: target,
            type: type,
            listener: boundListener,
        });
        target.addEventListener(type, boundListener);
    }
    /**
     * Unbind all events bound by calls to _bindEvent.
     *
     * @private
     */
    _unbindEvents(): void {
        this._eventListeners.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
    }
    /**
     * This method creates a CompiledEvent.
     * After a tick (setTimeout 0ms) the method '_tickAfterUserInteraction' is
     * called.
     * All events during a tick are caught and the CompiledEvent object is
     * complete. This analysis tries to extract the actions desired by the user.
     * Actions such as special character insertion, delete, backspace,
     * spellcheckers...
     * User events are received per batch, corresponding to an action.
     *
     * @see _tickAfterUserInteraction
     * @private
     * @returns {CompiledEvent}
     */
    _compileEvents(): CompiledEvent {
        if (this._compiledEvent) {
            return this._compiledEvent;
        }
        this._selectionHasChanged = false;
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
        setTimeout(this._processCompiledEvent.bind(this));
        return this._compiledEvent;
    }
    /**
     * Create a partial clone of the DOM starting from the current position of
     * the selection up to its closest display:block parent. This partial clone
     * of the DOM will be compared later on with the state of the DOM after the
     * composition has ended in order to indentify the change that was made.
     *
     * @private
     */
    _cloneForComposition(): void {
        // Check if already cloned earlier
        if (this._compiledEvent.clone) {
            return;
        }

        const selection = this._getSelection();
        // Look for closest block node starting from current text node
        let format = selection.anchorNode;
        while (
            format.parentNode &&
            format !== this.editable &&
            (format.nodeType === Node.TEXT_NODE || // text node can't be block => look for parent
                window.getComputedStyle(format as Element).display !== 'block')
        ) {
            format = format.parentNode;
        }
        const clone: ClonedNode = format.cloneNode(true) as ClonedNode;
        clone.origin = format;
        this._compiledEvent.clone = clone;

        (function addChildOrigin(clone: ClonedNode): void {
            // only mark DOM elements (type 1)
            if (clone.nodeType !== Node.ELEMENT_NODE) {
                return;
            }
            const childNodes = clone.origin.childNodes;
            clone.childNodes.forEach((child: Node, index) => {
                const clonedNode = child as ClonedNode;
                clonedNode.origin = childNodes[index];
                addChildOrigin(clonedNode);
            });
        })(clone);
    }
    /**
     * Process the compiled event by triggering the corresponding events on the
     * listener and reset the compiling process for the next stack.
     *
     * @private
     */
    _processCompiledEvent(): void {
        // Store and reset compiled event for the next stack.
        const compiledEvent = this._compiledEvent;
        this._compiledEvent = null;

        // TODO: transfer defaultPrevented information
        if (compiledEvent.defaultPrevented) {
            // The normalizer honors the preventDefault property of events. If
            // something was changed regardless of that property, the listener
            // won't know it. Let it know that the state might be inconsistent.
            this._triggerEvent('inconsistentState');
            return;
        }

        // Gather all modified nodes to notify the listener.
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
        compiledEvent.elements = elements;

        if (navigationKey.has(compiledEvent.key)) {
            this._processMove(compiledEvent);
        } else if (compiledEvent.type === 'composition') {
            this._processComposition(compiledEvent);
        } else if (compiledEvent.key === 'Backspace' || compiledEvent.key === 'Delete') {
            const direction = compiledEvent.key === 'Backspace' ? 'backward' : 'forward';
            const deleteEventPayload = {
                direction: direction,
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
                elements: elements,
            };
            const type = direction === 'backward' ? 'deleteBackward' : 'deleteForward';
            this._triggerEvent(type, deleteEventPayload);
        } else if (compiledEvent.key === 'Tab') {
            // TODO: maybe like keydown, there is no normalization proper here
            const tabEventPayload = {
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
                elements: elements,
            };
            this._triggerEvent('tab', tabEventPayload);
        } else if (compiledEvent.key === 'Enter') {
            const enterEventPayload = {
                altKey: compiledEvent.altKey,
                ctrlKey: compiledEvent.ctrlKey,
                metaKey: compiledEvent.metaKey,
                shiftKey: compiledEvent.shiftKey,
                elements: elements,
            };
            this._triggerEvent('enter', enterEventPayload);
        } else if (
            !compiledEvent.ctrlKey &&
            !compiledEvent.altKey &&
            ((compiledEvent.data && compiledEvent.data.length === 1) ||
                (compiledEvent.key && compiledEvent.key.length === 1) ||
                compiledEvent.key === 'Space')
        ) {
            // TODO: the above condition is unreadable
            // Different browsers handle the same action differently using
            // triggering different events with different payloads. We listen
            // to input events which uses data and keypress event which uses key.
            // In some browsers, input event data is empty (empty string) which
            // is wrong, hence we have to look at the keypress event.
            // When we have data, data has more value than key.
            // TODO comment: input > keypress > keydown
            const data =
                compiledEvent.data && compiledEvent.data.length === 1
                    ? compiledEvent.data
                    : compiledEvent.key;
            if (data === ' ' || data === 'Space') {
                // Some send space as ' ' and some send 'Space'.
                this._triggerEvent('insertText', {
                    value: '\u00A0',
                    elements: elements,
                }); // nbsp
            } else if (data && data[0] === '\u000A') {
                // The enter key on some mobile keyboards does not trigger an
                // actual keypress event but triggers an input event with the
                // LINE FEED (LF) (u000A) unicode character instead. This
                // normalizes it so it behaves like Shift+Enter.
                const enterEventPayload = {
                    altKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    shiftKey: true,
                    elements: elements,
                };
                this._triggerEvent('enter', enterEventPayload);
            } else {
                this._triggerEvent('insertText', {
                    value: data,
                    elements: elements,
                });
            }
        } else if (compiledEvent.type === 'keydown') {
            // TODO: Maybe the normalizer should not trigger keydown events:
            // - they are consistent accross browsers so no normalization needed
            // - they won't be able to be defaultPrevented after being triggered
            this._triggerEvent('keydown', compiledEvent);
        } else {
            // Something definitely happened since some events were compiled,
            // but it appears to be currently unsupported since it did not fall
            // in any of the previous conditional branches. The listener has no
            // way to understand the change in the DOM since the normalizer does
            // not understand it either. Let it know about the inconsistence.
            this._triggerEvent('inconsistentState', compiledEvent);
        }
    }
    /**
     * Format a custom event and trigger it.
     *
     * @param {string} type
     * @param {object} [params]
     */
    _triggerEvent(type: string, params = {}): void {
        const detail = params as NormalizedventPayload;
        detail.origin = 'EventNormalizer';
        const initDict = {
            detail: detail,
        };
        const event = new CustomEvent(type, initDict);
        this._eventCallback(event);
    }
    /**
     * Extract a mapping of the separate characters, their corresponding text
     * nodes and their offsets in said nodes from the given node's subtree.
     *
     * @private
     * @param node to extract from
     */
    _getCharactersMapping(node: Node): CharactersMapping {
        const textualNodes = this._getTextualNodes(node);
        let length = 0;
        let characters = '';
        const correspondingNodes: Array<Node | ClonedNode> = [];
        const offsets: number[] = [];
        textualNodes.forEach(function(node) {
            if (node.nodeValue) {
                // Split text nodes into separate chars
                node.nodeValue.split('').forEach(function(char, index) {
                    length++;
                    characters += char;
                    correspondingNodes.push(node);
                    offsets.push(index);
                });
            } else {
                // Push br node directly
                length++;
                characters += '\u000A'; // LINE FEED (LF)
                correspondingNodes.push(node);
                offsets.push(0);
            }
        });
        return {
            length: length,
            chars: characters,
            nodes: correspondingNodes,
            offsets: offsets,
        };
    }
    /**
     * Recursively extract the text and br nodes from the given node and its
     * children and return the given accumulator array after appending into it.
     *
     * @private
     * @param node to extract from
     * @param acc accumulator array to append to
     */
    _getTextualNodes(node: Node, acc: Node[] = []): Node[] {
        if (this._isTextualNode(node)) {
            acc.push(node);
        } else {
            node.childNodes.forEach(n => this._getTextualNodes(n, acc));
        }
        return acc;
    }
    _isTextualNode(node: Node): boolean {
        return node.nodeType === Node.TEXT_NODE || node.nodeName === 'BR';
    }
    /**
     * Compare the given previous and current strings and return the offsets in
     * the current string of the selection where the content differ between the
     * two. If they are equal, startOffset = current.length and endOffset = 0.
     *
     * @private
     * @param previous
     * @param current
     */
    _getChangeOffsets(previous: string, current: string): ChangeOffsets {
        let startOffset = 0;
        let endOffset = previous.length;
        const lengthDiff = current.length - previous.length;

        // Find the offset where a difference is first observed from the left
        while (startOffset < previous.length) {
            if (previous[startOffset] !== current[startOffset]) {
                break;
            }
            startOffset++;
        }

        // Find the offset where a difference is first observed from the right
        while (endOffset >= 0) {
            if (previous[endOffset] !== current[lengthDiff + endOffset]) {
                // The end offset of a selection is inclusive
                endOffset += 1;
                break;
            }
            endOffset--;
        }

        return {
            leftOffset: startOffset,
            rightOffset: lengthDiff + endOffset,
        };
    }
    /**
     * Get the current selection from the DOM. If there is no selection in the
     * DOM, return a fake one at offset 0 of the editable element.
     *
     * @private
     */
    _getSelection(): DomSelection {
        const selection = this.editable.ownerDocument.getSelection();

        if (!selection || selection.rangeCount === 0) {
            // No selection so a fake one is created
            return {
                anchorNode: this.editable,
                anchorOffset: 0,
                focusNode: this.editable,
                focusOffset: 0,
            };
        } else {
            return {
                anchorNode: selection.anchorNode,
                anchorOffset: selection.anchorOffset,
                focusNode: selection.focusNode,
                focusOffset: selection.focusOffset,
            };
        }
    }
    /**
     * Process the given compiled event as a composition to identify the text
     * that was inserted and trigger the corresponding events on the listener.
     *
     * @private
     */
    _processComposition(ev: CompiledEvent): void {
        if (!this.editable.contains(ev.clone.origin)) {
            // Some weird keyboards might replace the entire block element
            // rather than the text inside of it. This is currently unsupported.
            this._triggerEvent('inconsistentState', ev);
            return;
        }

        // The goal of this function is to precisely find what was inserted by
        // a keyboard supporting spell-checking and suggestions.
        // Example (`|` represents the text cursor):
        //   Previous content: 'My friend Christofe| was here.'
        //   Current content:  'My friend Christophe Matthieu| was here.'
        //   Actual text inserted by the keyboard: 'Christophe Matthieu'

        const previous = this._getCharactersMapping(ev.clone);
        const current = this._getCharactersMapping(ev.clone.origin);
        const previousLength = previous.length;
        const currentLength = current.length;
        // In the typical case, that is most spell-checking mobile keyboards,
        // the selection is set right after the inserted text. It can then be
        // used as a marker to identify the end of the change.
        const selection = this._getSelection();
        let insertEnd = 0;
        while (insertEnd < currentLength) {
            if (current.nodes[insertEnd] === selection.focusNode) {
                // The text has been flattened in the characters mapping. When
                // the index of the node has been found, use the selection
                // offset to find the index of the character proper.
                insertEnd += selection.focusOffset;
                break;
            }
            insertEnd++;
        }

        // If a composition event has been observed and its data property was
        // set, it can be used to compute the start of the change.
        let insertStart = insertEnd;
        if (ev.data) {
            insertStart -= ev.data.length;
        }

        // In the optimal case where both the selection is correctly placed and
        // the data property of the composition event is correctly set, the
        // above analysis is capable of finding the precise text that was
        // inserted. However, if any of these two conditions are not met, the
        // results might be spectacularly wrong. For example, spell checking
        // suggestions on MacOS are displayed while hovering the mispelled word,
        // regardless of the current position of the selection, and the
        // correction does not trigger an update of the selection position
        // either after correcting. Example (`|` represents the text cursor):
        // Previous content: 'My friend Christofe was here.|' Current content:
        // 'My friend Christophe Matthieu was here.|' Actual text inserted by
        // the keyboard: 'Christophe Matthieu' Result if data is set to
        // 'Christophe' (length: 10): 'e was here' Result if data is not set
        // (regardless of the selection): ''
        //
        // Because the first analysis might not be enough in some cases, a
        // second analysis must be performed. This analysis aims at precisely
        // identifying the offset of the actual change in the text by comparing
        // the previous content with the current one from left to right to find
        // the start of the change and from right to left to find its end.
        // Example (`|` represents the text cursor): Previous content: 'My
        // friend Christofe| was here.' Current content:  'My friend Christophe
        // Matthieu| was here.' Observed change:  'My friend Christo[fe => phe
        // Matthieu] was here.' Change offsets in the current content: {left:
        // 17, right: 29}
        const change = this._getChangeOffsets(previous.chars, current.chars);

        // It is possible that the left and right offsets of the observed change
        // are reversed in rtl direction or in some weird cases.
        // Example (`|` represents the collapsed selection):
        //   Previous content: 'aa aa aa| aa aa'
        //   Current content:  'aa aa aa aa| aa aa'
        //   Actual text inserted by the keyboard: 'aa '
        //   Observed change:  'aa ]aa aa aa aa[ aa'
        // TODO CHM: the below min/max does not cover all cases
        insertStart = Math.min(insertStart, Math.max(change.leftOffset, change.rightOffset));
        insertEnd = Math.max(insertEnd, Math.min(change.rightOffset, change.leftOffset));

        // Reconstruct the inserted text from the computed indices.
        const insertedText = current.chars.slice(insertStart, insertEnd);

        // Compute the selection in the previous DOM corresponding to the
        // selection of the observed correction in current DOM. For this
        // purpose, the nodes in the `previous` mapping were given a reference
        // to their original selves before cloning such that it can be used now.
        const previousNodes = previous.nodes as ClonedNode[];
        // The indices in the current DOM must be offset by the difference in
        // length between the previous and current content in order to compute
        // their corresponding indices in the previous DOM.
        const insertPreviousStart = insertStart;
        const insertPreviousEnd = insertEnd + previousLength - currentLength;
        const insertionRange: DomSelection = {
            anchorNode: previousNodes[insertPreviousStart].origin,
            anchorOffset: previous.offsets[insertPreviousStart],
            focusNode: previousNodes[insertPreviousEnd].origin,
            focusOffset: previous.offsets[insertPreviousEnd],
            origin: 'composition',
        };

        this._triggerEvent('setSelection', { domSelection: insertionRange });
        this._triggerEvent('insertText', { value: insertedText, elements: ev.elements });
    }
    /**
     * Process the given compiled event as a move and trigger the corresponding
     * events on the listener.
     *
     * @private
     */
    _processMove(ev: CompiledEvent): void {
        // The normalizer honors preventDefault for moves. If the selection was
        // moved regardless of the preventDefault setting, it must be restored.
        if (ev.defaultPrevented) {
            this._triggerEvent('restoreSelection');
        } else {
            // Set the selection according to the current one. Set the origin
            // key in order to track the source of the move.
            const selection = this._getSelection();
            selection.origin = ev.key;
            // TODO: nagivation word/line ?
            this._triggerEvent('setSelection', { domSelection: selection, elements: ev.elements });
        }
    }
    /**
     * Return true if the given selection is interpreted like a "select all".
     *
     * @param selection
     */
    _isSelectAll(selection: DomSelection): boolean {
        let anchorNode = selection.anchorNode;
        let anchorOffset = selection.anchorOffset;
        let focusNode = selection.focusNode;
        let focusOffset = selection.focusOffset;

        const body = this.editable.ownerDocument.body;
        // The selection might still be on a node which has since been removed
        const invalidStart = !anchorNode || !body.contains(anchorNode);
        const invalidEnd = !focusNode || !body.contains(focusNode);
        const invalidSelection = invalidStart || invalidEnd;

        // The selection might be collapsed in which case there is no selection
        const onlyOneNodeSelected = anchorNode === focusNode;
        const noCharacterSelected = anchorOffset === focusOffset;
        const isCollapsed = onlyOneNodeSelected && noCharacterSelected;

        // If the selection is invalid or is collapsed, it definitely does not
        // correspond to a select all action.
        if (invalidSelection || isCollapsed) {
            return false;
        }

        // TODO: browser don't go to lowest possible depth
        if (anchorNode.childNodes[anchorOffset]) {
            anchorNode = anchorNode.childNodes[anchorOffset];
            anchorOffset = 0;
        }
        if (focusNode.childNodes[focusOffset]) {
            focusNode = focusNode.childNodes[focusOffset];
            focusOffset = 0;
        }
        if (
            anchorOffset !== 0 ||
            (focusNode.nodeType === Node.TEXT_NODE && focusOffset !== focusNode.textContent.length)
        ) {
            return false;
        }

        // Look for visible nodes in the editable that would be outside the
        // selection. If such node exists, this is not a "select all".
        return this._isAtEdge(anchorNode, 'start') && this._isAtEdge(focusNode, 'end');
    }
    /**
     * Return true if the given element is at the edge of the editable node in
     * the given direction. An element is considered at the edge of the editable
     * node if there is no other visible element in editable that is located
     * beyond it in the given direction.
     *
     * @param element to check whether it is at the visible edge
     * @param side from which to look for textual nodes ('start' or 'end')
     */
    _isAtEdge(element: Node, side: 'start' | 'end'): boolean {
        if (!this.editable.contains(element)) return false;
        // Start from the top and do a depth-first search trying to find a
        // visible node that would be in editable and beyond the given element.
        let node: Node = this.editable;
        const child = side === 'start' ? 'firstChild' : 'lastChild';
        const sibling = side === 'start' ? 'nextSibling' : 'previousSibling';
        while (node) {
            if (node === element) {
                // The element was reached without finding another visible node.
                return true;
            }
            if (this._isTextualNode(node) && this._isVisible(node)) {
                // There is a textual node in editable beyond the given element.
                return false;
            }
            // Continue the depth-first search.
            if (node[child]) {
                node = node[child];
            } else if (node[sibling]) {
                node = node[sibling];
            } else if (node.parentNode === this.editable) {
                // Depth-first search has checked all elements in editable.
                return true;
            } else {
                node = node.parentNode[sibling];
            }
        }
        return true;
    }
    _isVisible(el: Node): boolean {
        if (el === this.editable) {
            // The editable node was reached without encountering a hidden
            // container. The editable node is supposed to be visible.
            return true;
        }
        // A <br> element with no next sibling is never visible.
        if (el.nodeName === 'BR' && !el.nextSibling) {
            return false;
        }
        const element = el.nodeType === Node.TEXT_NODE ? el.parentElement : el;
        const style = window.getComputedStyle(element as Element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        return this._isVisible(el.parentNode);
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
    _onComposition(ev: CompositionEvent): void {
        // Consider a spell checking keyboard that is being displayed following
        // a focus event into the editable zone. If some other code on the page
        // ends up hiding the editable zone for some functional reason, there is
        // no guarantee the spell checking keyboard will be updated accordingly.
        // In this case, if the user goes on to click on one of the proposition
        // from his spell checking keyboard, it will trigger a CompositionEvent
        // but, since the editable zone has since been hidden, we ignore it.
        if (this.editable.style.display === 'none') return;
        // TODO: what if we got detached from the DOM (beware of iframes) ?

        // Spell checking keyboards handle composition events inconsistently.
        // For example, compositionstart might not be triggered before a
        // compositionupdate, or compositionend might be triggered without
        // a prior compositionstart or compositionupdate. Because of this, we
        // might want to start compiling events on any composition event.
        const compiledEvent = this._compileEvents();

        // When the composition ends, the DOM is updated with the final result.
        // Since composition events are handled inconsistently by different
        // spell checking keyboards, their payload cannot be used to identify
        // the change they made. Instead, the DOM is cloned before the result
        // of the composition is applied to be compared later on in order to
        // properly identify the change that was made.
        // TODO comment: not all the DOM is cloned, only closest block element
        this._cloneForComposition();

        // Some composition events have useful information.
        if (ev.type !== 'compositionstart') {
            compiledEvent.type = 'composition';
            compiledEvent.data = ev.data;
        }
    }
    /**
     * Catch setSelection and selectAll actions
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

        const compiledEvent = this._compileEvents();

        // TODO comment: insert input data has more value than any other event
        // type, but 'input' type has nearly no value since we don't know if it's
        // a composition or something else, so we want to keep the original type
        // but use the data from the input event.
        if (!compiledEvent.type) {
            compiledEvent.type = ev.type;
            compiledEvent.data = ev.data;
        }

        if (
            (ev.inputType === 'insertCompositionText' ||
                ev.inputType === 'insertReplacementText') &&
            compiledEvent.type === 'composition'
        ) {
            // TODO comment: sometimes data won't be in compositionend (or it won't be triggered at all)
            // so, if we can catch this one, let's use it instead
            compiledEvent.type = 'composition';
            compiledEvent.data = ev.data;
            this._cloneForComposition();
        } else if (ev.inputType === 'insertParagraph' && compiledEvent.key === 'Unidentified') {
            compiledEvent.key = 'Enter';
        } else if (
            ev.inputType === 'deleteContentBackward' &&
            compiledEvent.key === 'Unidentified'
        ) {
            compiledEvent.key = 'Backspace';
            // TODO comment: safari mac for accents
            this._cloneForComposition();
        } else if (
            ev.inputType === 'deleteContentForward' &&
            compiledEvent.key === 'Unidentified'
        ) {
            compiledEvent.key = 'Delete';
        } else if (ev.inputType === 'insertText') {
            // update the key which does not have the accent with the data which contains the accent
            if (
                compiledEvent.type.indexOf('key') === 0 &&
                compiledEvent.key.length === 1 &&
                ev.data.length === 1
            ) {
                compiledEvent.key = ev.data; // keep accent
            } else if (
                ev.data &&
                ev.data.length === 1 &&
                ev.data !== compiledEvent.data &&
                compiledEvent.type === 'composition'
            ) {
                // swiftKey add automatically a space after the composition, without this line the arch is correct but not the selection
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
        this._selectAllOriginElement = this._getSelection().anchorNode;

        // See comment on the same line in _onCompositionStart handler.
        if (this.editable.style.display === 'none') return;

        // Dead keys will trigger composition and input events later
        if (ev.type === 'keydown' && ev.key === 'Dead') return;

        const compiledEvent = this._compileEvents();
        compiledEvent.defaultPrevented = compiledEvent.defaultPrevented || ev.defaultPrevented;
        compiledEvent.type = compiledEvent.type || ev.type;
        compiledEvent.key = ev.key;
        compiledEvent.altKey = ev.altKey;
        compiledEvent.ctrlKey = ev.ctrlKey;
        compiledEvent.metaKey = ev.metaKey;
        compiledEvent.shiftKey = ev.shiftKey;
    }
    /**
     * Catch setSelection and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onMouseDown(ev: MouseEvent): void {
        this._selectionHasChanged = false;
        // store mousedown event to detect selection change from mouse selection
        this._mousedownInEditable = ev;
        this._selectAllOriginElement = ev.target as Node;
        setTimeout(() => {
            this._selectAllOriginElement = this._getSelection().anchorNode;
        }, 0);
    }
    /**
     * Catch setSelection actions
     * After a tick (setTimeout 0) to have the new selection in the DOM
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
            this._selectAllOriginElement = ev.target as Node;
            const target = this._mousedownInEditable.target as Node;
            this._mousedownInEditable = null;
            if (ev.target instanceof Element) {
                let selection: DomSelection = this._getSelection();
                if (!target.contains(selection.anchorNode) && target === ev.target) {
                    selection = {
                        anchorNode: target,
                        anchorOffset: 0,
                        focusNode: target,
                        focusOffset:
                            target.nodeType === Node.ELEMENT_NODE
                                ? target.childNodes.length
                                : target.nodeValue.length,
                        origin: 'pointer',
                    };
                }
                if (this._selectionHasChanged) {
                    this._triggerEvent('setSelection', { domSelection: selection });
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
        if (this._selectionHasChanged) {
            // The _selectionHasChanged hook will disappear once the renderer
            // only re-renders what has changed rather than re-rendering all.
            // Right now it is needed to avoid an infinite loop when selectAll
            // triggers a new setSelection and the selection changes every time.
            return;
        }
        this._selectionHasChanged = true;
        // Testing whether the entire document is selected or not is a costly
        // process, so we use the below heuristics before actually checking.
        const isVisible = this.editable.style.display !== 'none';
        const isCurrentlySelecting = this._mousedownInEditable && isVisible;
        const trigger = !this._compiledEvent || this._compiledEvent.key === 'a';
        const selection = this._getSelection();
        if (!isCurrentlySelecting && trigger && this._isSelectAll(selection)) {
            if (!this._selectAll) {
                this._selectAll = true;
                this._triggerEvent('selectAll', {
                    origin: this._compiledEvent ? 'keypress' : 'pointer',
                    target: this._selectAllOriginElement,
                    domSelection: selection,
                });
            }
        } else {
            this._selectAll = false;
        }
    }
}
