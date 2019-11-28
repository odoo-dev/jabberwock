import { Direction } from './VRange';
import { MutationNormalizer } from './MutationNormalizer';
import { caretPositionFromPoint } from '../../utils/polyfill';

const pointerEventTypes = ['click', 'mousedown', 'touchend'];

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

const inputTypeCommands = new Set([
    'historyUndo',
    'historyRedo',
    'formatBold',
    'formatItalic',
    'formatUnderline',
    'formatStrikeThrough',
    'formatSuperscript',
    'formatSubscript',
    'formatJustifyFull',
    'formatJustifyCenter',
    'formatJustifyRight',
    'formatJustifyLeft',
    'formatIndent',
    'formatOutdent',
    'formatRemove',
    'formatSetBlockTextDirection',
    'formatSetInlineTextDirection',
    'formatBackColor',
    'formatFontColor',
    'formatFontName',
]);

/*
 * sources:
 * - wikipedia
 * - google translate
 * - https://jrgraphix.net/r/Unicode/
 * helper:
 * - https://apps.timwhitlock.info/js/regex
 */
const alphabetsContainingSpaces = new RegExp(
    '(' +
        [
            '[а-яА-ЯЀ-ӿԀ-ԯ]+', // cyrillic
            '[Ͱ-Ͼἀ-῾]+', // greek & coptic
            '[\u0530-\u058F]+', // armenian
            '[\u0600-۾ݐ-ݾ\u08a0-\u08fe]+', // arabic
            '[\u0900-\u0DFF]+', // India
            '[a-zA-Z]+', // latin
            '[a-zA-ZÀ-ÿ]+', // latin-1
            '[a-zA-ZĀ-ſ]+', // Latin Extended-A
            '[a-zA-Zƀ-ɏ]+', // Latin Extended-B
        ].join('|') +
        ')$',
);

/**
 * These event types might, in specific cases of browsers or spell-checking
 * keyboard, trigger dom events in multiple javascript stacks. They will require
 * to observe events during two ticks rather than after a single tick.
 */
const MultiStackEventTypes = ['input', 'compositionend', 'selectAll'];

export interface DomRangeDescription {
    readonly startContainer: Node;
    readonly startOffset: number;
    readonly endContainer: Node;
    readonly endOffset: number;
    readonly direction: Direction;
}

export interface NormalizedAction {
    type: string;
    domRange?: DomRangeDescription;
    vRange?: object;
    direction?: Direction;
    text?: string;
    html?: string;
    files?: File[];
    format?: string;
    target?: DomLocation;
}
export interface NormalizedEvent {
    type: string;
    actions: NormalizedAction[];
    defaultPrevented: boolean;
}
export interface NormalizedCompositionEvent extends NormalizedEvent {
    type: 'composition';
    from: string;
    to: string;
}
export interface NormalizedKeyboardEvent extends NormalizedEvent {
    type: 'keyboard';
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    inputType?: string;
}

export interface DomLocation {
    offsetNode: Node;
    offset: number;
}

export interface NormalizedPointerEvent extends NormalizedEvent {
    type: 'pointer';
    target: DomLocation;
    inputType?: string;
}

export interface EventBatch {
    events: NormalizedEvent[];
    mutatedElements?: Set<Node>;
}

interface DataTransferDetail {
    'text/plain': string;
    'text/html': string;
    'text/uri-list': string;
    files: File[];
    originalEvent: Event;
    draggingFromEditable: boolean;
    caretPosition: DomLocation;
    range: DomRangeDescription;
}

interface CompiledEvent {
    type: string; // main event type, e.g. 'keydown', 'composition', 'move', ...
    key?: string; // the key pressed for keyboard events
    code?: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    data?: string; // specific data for input events
    mutatedNodes?: Set<Node>; // the nodes that were mutated, if any
    defaultPrevented?: boolean;
    inputType?: string;
    caretPosition?: DomLocation;
    dataTransfer?: DataTransferDetail;
}

interface EventListenerDeclaration {
    readonly target: EventTarget;
    readonly type: string;
    readonly listener: EventListener;
}

export class EventNormalizer {
    /**
     * HTML element that represents the editable zone. Only events happening
     * inside the editable zone are subject to normalization.
     */
    editable: HTMLElement;
    /**
     * Event listeners that are bound in the DOM by the normalizer on creation
     * and unbound on destroy.
     */
    _eventListeners: EventListenerDeclaration[] = [];
    /**
     * The MutationNormalizer used by the normalizer to watch the nodes that are
     * being modified since the normalizer creation until it is drestroyed.
     */
    _mutationNormalizer: MutationNormalizer;
    /**
     * Events fired during the current tick.
     */
    _events: Event[];
    /**
     * Events fired during the previous action.
     */
    _lastEvents: Event[];
    /**
     * In some cases, the observation must be delayed to the next tick. In these
     * cases, this control variable will be set to true such that the analysis
     * process knows the current event queue processing has been delayed.
     */
    _secondTickObservation = false;
    /**
     * Callback function to trigger for each user action.
     */
    _triggerEvent: (batch: EventBatch) => void;
    /**
     * Whether the current state of the selection is already recognized as being
     * a "select all".
     */
    _currentlySelectingAll: boolean;
    /**
     * Original mousedown event from which the current selection was made.
     */
    _initialMousedownInEditable: boolean;
    /**
     * Original selection target before the current selection is updated.
     */
    _initialCaretPosition: DomLocation;
    /**
     * TODO: ask CHM
     */
    _rangeHasChanged: boolean;
    /**
     * Whether the current dragging operation started from inside the editable.
     * False if the dragging started outside of the editable.
     */
    _draggingFromEditable: boolean;
    /**
     * TODO: WTF ?
     */
    _setTimeoutID: NodeJS.Timeout;

    constructor(editable: HTMLElement, callback: (res: EventBatch) => void) {
        this.editable = editable;
        this._triggerEvent = callback;

        const document = this.editable.ownerDocument;
        this._bindEvent(editable, 'compositionstart', this._registerEvent);
        this._bindEvent(editable, 'compositionupdate', this._registerEvent);
        this._bindEvent(editable, 'compositionend', this._registerEvent);
        this._bindEvent(editable, 'beforeinput', this._registerEvent);
        this._bindEvent(editable, 'input', this._registerEvent);

        this._bindEvent(document, 'selectionchange', this._onSelectionChange);
        this._bindEvent(document, 'click', this._onClick);
        this._bindEvent(document, 'touchend', this._onClick);
        this._bindEvent(editable, 'contextmenu', this._onContextMenu);
        this._bindEvent(document, 'mousedown', this._onPointerDown);
        this._bindEvent(document, 'touchstart', this._onPointerDown);
        this._bindEvent(editable, 'keydown', this._onKeyDownOrKeyPress);
        this._bindEvent(editable, 'keypress', this._onKeyDownOrKeyPress);
        this._bindEvent(editable, 'cut', this._onClipboard);
        this._bindEvent(editable, 'paste', this._onClipboard);
        this._bindEvent(editable, 'dragstart', this._onDragStart);
        this._bindEvent(editable, 'drop', this._onDrop);

        this._mutationNormalizer = new MutationNormalizer(editable);
    }
    /**
     * Called when destroy the event normalizer.
     * Remove all added handlers.
     *
     */
    destroy(): void {
        this._mutationNormalizer.destroy();
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
        target.addEventListener(type, boundListener, false);
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
     * Register given event on the this._events queue. If the queue is not yet
     * initialized or has been cleared prior to this call, re-initialize it.
     *
     * After a tick (setTimeout 0ms) the '_processEvents' method is called. All
     * events that happened during the tick are read from the queue and the
     * analysis tries to extract the actions desired by the user such as insert,
     * delete, backspace, spell checking, special characters, etc.
     *
     * @see _processEvents
     * @private
     */
    _registerEvent(ev: Event): void {
        if (!this._events) {
            // The queue is not initialized or has been reset, so this is a new
            // user action. Re-initialize the queue such that the analysis is
            // not polluted by previous observations.
            this._events = [];
            this._secondTickObservation = false;
            // Start observing mutations.
            this._mutationNormalizer.start();
            // All events during this tick will be processed in the next one.
            setTimeout(this._processEvents.bind(this));
        }
        this._events.push(ev);
    }
    /**
     * Process the registered events and create the compiled event.
     *
     * @private
     */
    _processEvents(): void {
        // In some cases, for example cutting with Cmd+X on Safari, the browser
        // triggers events in two different stacks. In such cases, observing
        // events occuring during one tick is not enough so we need to delay the
        // analysis after we observe events during two ticks instead.
        const needSecondTickObservation = this._events.every(ev => {
            return !MultiStackEventTypes.includes(ev.type);
        });
        if (needSecondTickObservation && !this._secondTickObservation) {
            this._secondTickObservation = true;
            setTimeout(this._processEvents.bind(this));
            return;
        }

        this._mutationNormalizer.stop();
        // Store and reset compiled event for the next stack.
        const events = this._events;
        this._lastEvents = events;
        this._events = null;

        let compiledEvents: CompiledEvent[] = [];
        events.forEach(ev => {
            let lastCompiledEvent =
                compiledEvents.length && compiledEvents[compiledEvents.length - 1];
            if (['compositionstart', 'compositionupdate', 'compositionend'].includes(ev.type)) {
                const compositionEvent = ev as CompositionEvent;
                if (lastCompiledEvent) {
                    if (lastCompiledEvent.type === 'composition') {
                        if (compositionEvent.data) {
                            lastCompiledEvent.data = compositionEvent.data;
                            lastCompiledEvent.defaultPrevented =
                                lastCompiledEvent.defaultPrevented ||
                                compositionEvent.defaultPrevented;
                        }
                        return;
                    }
                }
                const compiledEvent = {
                    type: 'composition',
                    data: compositionEvent.data,
                    defaultPrevented: compositionEvent.defaultPrevented,
                } as CompiledEvent;
                if (lastCompiledEvent) {
                    compiledEvent.inputType = lastCompiledEvent.inputType;
                    compiledEvent.key = lastCompiledEvent.key;
                    compiledEvent.code = lastCompiledEvent.code;
                    compiledEvent.altKey = lastCompiledEvent.altKey;
                    compiledEvent.ctrlKey = lastCompiledEvent.ctrlKey;
                    compiledEvent.metaKey = lastCompiledEvent.metaKey;
                    compiledEvent.shiftKey = lastCompiledEvent.shiftKey;
                }
                compiledEvents = [compiledEvent];
            } else if (ev.type === 'selectAll') {
                compiledEvents.push({ type: 'selectAll' });
            } else if (
                (ev.type === 'keydown' &&
                    (!lastCompiledEvent ||
                        (lastCompiledEvent.type !== 'composition' &&
                            lastCompiledEvent.key !== 'Unidentified') ||
                        lastCompiledEvent.code)) ||
                (!lastCompiledEvent && ev.type === 'keypress')
            ) {
                // TODO comment: This is supposed to be the "keydown" section,
                // but there is a case where we want to use the "keypress" event
                // instead: In some cases(Mac), we can get a keypress without
                // keydown. In such cases, we want to create the event with the
                // keypress rather than only using keypress for enrichment.

                // browser like safari send composition for accent then trigger
                // keydown we use keydown to enrich the composition with the key
                // and code
                const keyboardEv = ev as KeyboardEvent;
                if (keyboardEv.key === 'Dead') {
                    return;
                }
                compiledEvents.push({
                    type: 'keydown',
                    key: keyboardEv.key,
                    code: keyboardEv.code,
                    altKey: keyboardEv.altKey,
                    ctrlKey: keyboardEv.ctrlKey,
                    metaKey: keyboardEv.metaKey,
                    shiftKey: keyboardEv.shiftKey,
                    defaultPrevented: keyboardEv.defaultPrevented,
                });
            } else if (ev.type === 'cut' || ev.type === 'paste' || ev.type === 'drop') {
                const evClipboardEvent = ev as CustomEvent<DataTransferDetail>;
                if (!lastCompiledEvent) {
                    const detail = evClipboardEvent.detail;
                    lastCompiledEvent = {
                        caretPosition: detail.caretPosition,
                        type: 'pointer',
                        defaultPrevented: detail.originalEvent.defaultPrevented,
                    };
                    compiledEvents.push(lastCompiledEvent);
                }
                if (ev.type === 'cut') {
                    lastCompiledEvent.inputType = 'deleteByCut';
                } else if (ev.type === 'drop') {
                    lastCompiledEvent.inputType = 'insertFromDrop';
                } else {
                    lastCompiledEvent.inputType = 'insertFromPaste';
                }
                compiledEvents.push({
                    type: ev.type,
                    dataTransfer: evClipboardEvent.detail,
                });
            } else if (lastCompiledEvent) {
                // The following event types enrich the current compiled event
                // rather than creating a new one.
                if (ev.type === 'keypress' || ev.type === 'keydown') {
                    this._enrichByKeypress(lastCompiledEvent, ev as KeyboardEvent);
                } else {
                    this._enrichByInput(lastCompiledEvent, ev as InputEvent);
                }
            } else if (ev.type === 'input') {
                const evInput = ev as InputEvent;
                if (evInput.inputType === 'insertReplacementText' || !evInput.inputType) {
                    // safari completion/correction
                    compiledEvents = [
                        {
                            type: 'composition',
                            inputType: 'insertReplacementText',
                            data: evInput.data,
                            defaultPrevented: ev.defaultPrevented,
                        },
                    ];
                }
                compiledEvents.push({
                    type: evInput.type,
                    data: evInput.data,
                    inputType: evInput.inputType || (evInput.data && 'textInput'),
                    defaultPrevented: evInput.defaultPrevented,
                });
            }
        });

        // Compute the set of mutated elements accross all observed events.
        const mutatedElements = this._mutationNormalizer.getMutatedElements();

        // Create the custom events corresponding to the compiled data from
        // observed events.
        let normalizedEvents: NormalizedEvent[] = [];
        let actions: NormalizedAction[];

        compiledEvents.forEach(compiledEvent => {
            if (compiledEvent.type === 'keydown' || compiledEvent.inputType === 'insertParagraph') {
                actions = this._analyzeKeyboard(compiledEvent, mutatedElements);
                const normalizedEvent = {
                    type: 'keyboard',
                    key:
                        compiledEvent.data && compiledEvent.data.length === 1
                            ? compiledEvent.data
                            : compiledEvent.key,
                    code: compiledEvent.code,
                    altKey: compiledEvent.altKey,
                    ctrlKey: compiledEvent.ctrlKey,
                    metaKey: compiledEvent.metaKey,
                    shiftKey: compiledEvent.shiftKey,
                    defaultPrevented: compiledEvent.defaultPrevented,
                    actions: actions,
                } as NormalizedKeyboardEvent;
                if (compiledEvent.inputType) {
                    normalizedEvent.inputType = compiledEvent.inputType;
                }
                normalizedEvents.push(normalizedEvent);
            } else if (compiledEvent.type === 'composition') {
                normalizedEvents.push(...this._analyzeComposition(compiledEvent));
            } else if (compiledEvent.type === 'pointer') {
                actions = [];
                normalizedEvents.push({
                    type: 'pointer',
                    target: compiledEvent.caretPosition,
                    inputType: compiledEvent.inputType,
                    defaultPrevented: compiledEvent.defaultPrevented,
                    actions: actions,
                } as NormalizedPointerEvent);
            } else if (compiledEvent.type === 'cut') {
                actions.push(...this._analyzeRemove(compiledEvent));
            } else if (compiledEvent.type === 'paste') {
                actions.push(...this._analyzePaste(compiledEvent));
            } else if (compiledEvent.type === 'drop') {
                actions.push(...this._analyzeDrop(compiledEvent));
            } else if (compiledEvent.type === 'selectAll') {
                actions.push(...this._makeSelectAll());
            } else if (inputTypeCommands.has(compiledEvent.inputType)) {
                const inputType = compiledEvent.inputType;
                if (inputType.indexOf('format') === 0) {
                    const format = inputType[6].toLowerCase() + inputType.slice(7);
                    actions = [
                        this._makePayload('applyFormat', {
                            format: format,
                            data: compiledEvent.data,
                        }),
                    ];
                } else {
                    actions = [this._makePayload(inputType, {})];
                }
                normalizedEvents.push({
                    type: 'pointer',
                    target: this._initialCaretPosition,
                    inputType: compiledEvent.inputType,
                    defaultPrevented: compiledEvent.defaultPrevented,
                    actions: actions,
                } as NormalizedPointerEvent);
            }
        });

        normalizedEvents = normalizedEvents.filter((normalizedEvent: NormalizedKeyboardEvent) => {
            // max safari trigger the keyboard and later change the range to select all
            return (
                normalizedEvent.actions.length ||
                normalizedEvent.type !== 'keyboard' ||
                normalizedEvent.key !== 'a' ||
                !normalizedEvent.metaKey
            );
        });

        if (normalizedEvents.length || mutatedElements.size) {
            this._triggerEvent({ events: normalizedEvents, mutatedElements });
        }
    }
    /**
     * @private
     * @param {CompiledEvent} ev
     * @param {KeyboardEvent} keypress
     */
    _enrichByKeypress(ev: CompiledEvent, keypress: KeyboardEvent): void {
        if (keypress.key !== 'Dead') {
            ev.key = keypress.key;
        }
        if (keypress.code) {
            ev.code = keypress.code;
        }
        ev.altKey = keypress.altKey;
        ev.ctrlKey = keypress.ctrlKey;
        ev.metaKey = keypress.metaKey;
        ev.shiftKey = keypress.shiftKey;
        ev.defaultPrevented = ev.defaultPrevented || keypress.defaultPrevented;
    }
    /**
     * @private
     * @param {CompiledEvent} compiledEvent
     * @param {InputEvent} ev
     */
    _enrichByInput(compiledEvent: CompiledEvent, ev: InputEvent): void {
        compiledEvent.defaultPrevented = compiledEvent.defaultPrevented || ev.defaultPrevented;
        const inputType = ev.inputType;
        const type = compiledEvent.type;
        const key = compiledEvent.key;
        const data = compiledEvent.data;
        const code = compiledEvent.code;
        if (type === 'composition') {
            if (['insertCompositionText', 'insertReplacementText'].includes(inputType)) {
                // Some spell checking keyboards do not properly fill the textual
                // data of the composition in the compositionend event. To protect
                // against this, use the data from the input event instead.
                compiledEvent.data = ev.data;
            } else if (inputType === 'insertText') {
                if (type === 'composition' && ev.data && ev.data.length === 1 && ev.data !== data) {
                    // Some spell-checking keyboards automatically add a space
                    // after the composition. Compile the two changes together.
                    compiledEvent.data += ev.data;
                }
            }
        } else if (key === 'Unidentified' || code === '') {
            // Some spell-checking keyboards don't set a value for key in the
            // keydown/keypress event, so we must guess it from the inputType.
            if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
                compiledEvent.key = 'Enter';
                compiledEvent.code = 'Enter';
            } else if (inputType === 'deleteContentBackward') {
                compiledEvent.key = 'Backspace';
                compiledEvent.code = 'Backspace';
            } else if (inputType === 'deleteContentForward') {
                compiledEvent.key = 'Delete';
                compiledEvent.code = 'Delete';
            } else {
                // The data property is supposed to contain the accentuated
                // character, but it is an "Unidentified" key for some browsers.
                compiledEvent.key = ev.data;
            }
        } else if (!data) {
            // In most other cases, the data of the input event is more richer
            // than the other events data property.
            compiledEvent.data = ev.data;
        }
        compiledEvent.inputType = inputType || (data && 'textInput');
    }
    _analyzeKeyboard(compiledEvent: CompiledEvent, elements: Set<Node>): NormalizedAction[] {
        const events = [];
        const key = compiledEvent.key;
        const data = compiledEvent.data;
        const inputType = compiledEvent.inputType;
        if (navigationKey.has(key)) {
            // Set the range according to the current one. Set the origin key
            // in order to track the source of the move.
            const range = this._getRange();
            // TODO: nagivation word/line ?
            events.push(this._makePayload('setRange', { domRange: range }));
        } else if (key === 'Backspace' || key === 'Delete' || inputType === 'deleteByCut') {
            events.push(...this._analyzeRemove(compiledEvent));
        } else if (key === 'Enter') {
            if (compiledEvent.inputType === 'insertLineBreak') {
                events.push(this._makePayload('insertText', { text: '\n', html: '<br/>' }));
            } else {
                events.push(this._makePayload('insertParagraph', {}));
            }
        } else if (inputTypeCommands.has(inputType)) {
            if (inputType.indexOf('format') === 0) {
                const format = inputType[6].toLowerCase() + inputType.slice(7);
                events.push(this._makePayload('applyFormat', { format: format, data: data }));
            } else {
                events.push(this._makePayload(inputType, {}));
            }
        } else if (
            elements.size &&
            !compiledEvent.ctrlKey &&
            !compiledEvent.altKey &&
            (compiledEvent.code === 'Space' ||
                (data && data.length === 1) ||
                (key && key.length === 1))
        ) {
            events.push(...this._analyzeSampleInsert(compiledEvent));
        }
        return events;
    }
    _analyzePaste(ev: CompiledEvent): NormalizedAction[] {
        return [this._analyzeDataTransfer(ev.dataTransfer)];
    }
    _analyzeDrop(ev: CompiledEvent): NormalizedAction[] {
        const events = [];
        if (ev.dataTransfer.draggingFromEditable && !ev.dataTransfer.files.length) {
            events.push(this._makePayload('deleteContent', { direction: Direction.FORWARD }));
        }
        events.push(this._makePayload('setRange', { domRange: ev.dataTransfer.range }));
        events.push(this._analyzeDataTransfer(ev.dataTransfer));
        return events;
    }
    _analyzeDataTransfer(dataTransfer: DataTransferDetail): NormalizedAction {
        if (dataTransfer.files.length) {
            return this._makePayload('insertFiles', { files: dataTransfer.files });
        }
        const uri = dataTransfer['text/uri-list'];
        // eslint-disable-next-line no-control-regex
        const html = dataTransfer['text/html'].replace(/\x00/g, ''); // replace for drag&drop from firefox to chrome
        const text = dataTransfer['text/plain'];
        if (html) {
            if (uri) {
                const temp = document.createElement('temp');
                temp.innerHTML = html;
                const element = temp.querySelector('a, img');
                if (element) {
                    if (
                        !dataTransfer.draggingFromEditable &&
                        element.nodeName === 'A' &&
                        element.innerHTML === ''
                    ) {
                        // add default content if external link
                        element.innerHTML = text;
                    }
                    return this._makePayload('insertHtml', { html: element.outerHTML });
                }
                return this._makePayload('insertHtml', { html: html });
            }
            return this._makePayload('insertHtml', {
                html: html && html.replace(/^<meta[^>]+>/, ''),
                text: text,
            });
        }
        if (uri) {
            return this._makePayload('insertHtml', {
                html: '<a href="' + uri + '">' + uri + '</a>',
            });
        }
        return this._makePayload('insertText', { text: text });
    }
    _analyzeSampleInsert(ev: CompiledEvent): NormalizedAction[] {
        const key = ev.key;
        const data = ev.data;
        // Different browsers handle the same action differently using
        // triggering different events with different payloads. We listen
        // to input events which uses data and keypress event which uses key.
        // In some browsers, input event data is empty (empty string) which
        // is wrong, hence we have to look at the keypress event.
        // When we have data, data has more value than key.
        // TODO comment: input > keypress > keydown
        const keydata = data && data.length === 1 ? data : key;
        const events = [];
        if (keydata === ' ' || keydata === 'Space') {
            // Some send space as ' ' and some send 'Space'.
            // Insert a non-breaking space instead.
            ev.code = 'Space';
            ev.key = ' ';
            events.push(this._makePayload('insertText', { text: ' ' }));
        } else {
            events.push(this._makePayload('insertText', { text: keydata }));
        }
        return events;
    }
    /**
     * Process the given compiled event as a composition to identify the text
     * that was inserted and trigger the corresponding events on the listener.
     *
     * @private
     */
    _analyzeComposition(
        ev: CompiledEvent,
    ): (NormalizedCompositionEvent | NormalizedKeyboardEvent)[] {
        if (!ev.inputType) {
            return [];
        }

        // The goal of this function is to precisely find what was inserted by
        // a keyboard supporting spell-checking and suggestions.
        // Example (`|` represents the text cursor):
        //   Previous content: 'My friend Christofe| was here.'
        //   Current content:  'My friend Christophe Matthieu| was here.'
        //   Actual text inserted by the keyboard: 'Christophe Matthieu'
        const res = this._mutationNormalizer.getCharactersMapping();

        let index = res.index;
        let insert = res.insert;
        let remove = res.remove;
        if (remove === '' && insert.length === 1 && ev.key) {
            // virtual keyboard like swiftKey send composition event for each keypress
            return [
                {
                    type: 'keyboard',
                    key: ev.key,
                    code: ev.code,
                    altKey: ev.altKey,
                    ctrlKey: ev.ctrlKey,
                    metaKey: ev.metaKey,
                    shiftKey: ev.shiftKey,
                    inputType: 'insertCompositionText',
                    defaultPrevented: ev.defaultPrevented,
                    actions: [this._makePayload('insertText', { text: insert })],
                },
            ];
        }
        const data = ev.data;
        if (insert === remove && data) {
            insert = data;
            remove = data;
        }

        const range = this._getRange();
        if (index === -1) {
            // It is possible that the index of the observed change are undefined
            // Example (`|` represents the collapsed selection):
            //   Previous content: 'aa aa aa| aa aa'
            //   Current content:  'aa aa aa aa| aa aa'
            //   Actual text inserted by the keyboard: 'aa '
            //   Observed change:  'aa ]aa aa aa aa[ aa'
            // TODO CHM: the below min/max does not cover all cases

            // With most spell-checking mobile keyboards, the range is set right
            // after the inserted text. It can then be used as a marker to
            // identify the end of the change.
            let insertEnd = 0;
            // The text has been flattened in the characters mapping. When
            // the index of the node has been found, use the range offset
            // to find the index of the character proper.
            insertEnd += range.endOffset;
            index = insertEnd - insert.length;
        } else {
            let offset = index + insert.length - 1;
            if (
                res.current.nodes[offset] &&
                (range.endContainer !== res.current.nodes[offset] ||
                    range.endOffset !== res.current.offsets[offset] + 1)
            ) {
                offset++;
                while (
                    res.current.nodes[offset] &&
                    (range.endContainer !== res.current.nodes[offset] ||
                        range.endOffset > res.current.offsets[offset])
                ) {
                    const text = res.current.chars[offset];
                    insert += text;
                    remove += text;
                    offset++;
                }
            }
        }

        const before = res.previous.chars.slice(0, index);
        const match = before.match(alphabetsContainingSpaces);
        if (
            match &&
            (insert === '' || alphabetsContainingSpaces.test(insert)) &&
            (remove === '' || alphabetsContainingSpaces.test(remove))
        ) {
            // the word is write in a alphabet who contain space, search
            // to complete the change and include the rest of the word
            const beginWord = match[1];
            remove = beginWord + remove;
            insert = beginWord + insert;
            index -= beginWord.length;
        } else if (data && insert && (remove || insert !== ' ') && data !== insert) {
            const charIndex = data.lastIndexOf(insert);
            if (charIndex !== -1) {
                index -= charIndex;
                insert = data;
                const len = remove.length + charIndex;
                remove = res.previous.chars.slice(index, index + len + 1);
            }
        }

        const hadEndSpace = remove[remove.length - 1] === ' ';
        const hasEndSpace = insert[insert.length - 1] === ' ';
        let rawRemove = remove;
        let rawInsert = insert;
        if (hasEndSpace) {
            if (hadEndSpace) {
                rawRemove = rawRemove.slice(0, -1);
            }
            rawInsert = rawInsert.slice(0, -1);
        }

        const nodes = res.previous.nodes;
        const offsets = res.previous.offsets;
        const last = nodes[nodes.length - 1];
        const lastIndex = offsets[offsets.length - 1] + 1;
        const end = index + rawRemove.length;
        const actions = [
            this._makePayload('setRange', {
                domRange: {
                    startContainer: nodes[index] || last,
                    startOffset: index in offsets ? offsets[index] : lastIndex,
                    endContainer: nodes[end] || last,
                    endOffset: end in offsets ? offsets[end] : lastIndex,
                    direction: Direction.BACKWARD,
                } as DomRangeDescription,
            }),
            this._makePayload('insertText', { text: rawInsert }),
        ];

        if (hasEndSpace) {
            if (hadEndSpace) {
                index += rawRemove.length;
                actions.push(
                    this._makePayload('setRange', {
                        domRange: {
                            startContainer: nodes[index],
                            startOffset: offsets[index],
                            endContainer: nodes[end],
                            endOffset: offsets[index + 1],
                            direction: Direction.BACKWARD,
                        } as DomRangeDescription,
                    }),
                );
            }
            actions.push(this._makePayload('insertText', { text: ' ' }));
        }

        return [
            {
                type: 'composition',
                from: remove,
                to: insert,
                defaultPrevented: ev.defaultPrevented,
                actions: actions,
            },
        ];
    }
    /**
     * Process the given compiled event as a backspace/delete to identify the text
     * that was removed and trigger the corresponding events on the listener.
     *
     * @private
     */
    _analyzeRemove(ev: CompiledEvent): NormalizedAction[] {
        const direction = ev.key === 'Backspace' ? Direction.BACKWARD : Direction.FORWARD;
        if (
            ev.inputType === 'deleteContentForward' ||
            ev.inputType === 'deleteContentBackward' ||
            ev.type === 'cut'
        ) {
            return [
                this._makePayload('deleteContent', {
                    direction: direction,
                }),
            ];
        }
        const res = this._mutationNormalizer.getCharactersMapping();
        if (res.insert === res.remove || res.remove === '') {
            return [];
        }
        if (ev.inputType === 'deleteWordForward' || ev.inputType === 'deleteWordBackward') {
            return [
                this._makePayload('deleteWord', {
                    direction: direction,
                    text: res.remove,
                }),
            ];
        }
        if (ev.inputType === 'deleteHardLineForward' || ev.inputType === 'deleteHardLineBackward') {
            return [
                this._makePayload('deleteHardLine', {
                    direction: direction,
                    domRange: {
                        startContainer: res.previous.nodes[res.index],
                        startOffset: res.previous.offsets[res.index],
                        endContainer: res.previous.nodes[res.index + res.remove.length - 1],
                        endOffset: res.previous.offsets[res.index + res.remove.length - 1] + 1,
                        direction: direction,
                    } as DomRangeDescription,
                }),
            ];
        }
        return [
            this._makePayload('deleteContent', {
                direction: direction,
            }),
        ];
    }
    /**
     * @private
     * @param {KeyboardEvent} ev
     * @returns CompiledEvent
     */
    _makeSelectAll(): NormalizedAction[] {
        return [
            this._makePayload('selectAll', {
                target: this._initialCaretPosition,
                domRange: this._getRange(),
            }),
        ];
    }
    /**
     * Format a custom event.
     *
     * @param {string} type
     * @param {object} [params]
     */
    _makePayload(type: string, params: object): NormalizedAction {
        const detail = params as NormalizedAction;
        detail.type = type;
        return detail;
    }
    /**
     * Return true if the given node can be considered a textual node, that is
     * a text node or a BR node.
     *
     * @private
     * @param node
     */
    _isTextualNode(node: Node): boolean {
        return node.nodeType === Node.TEXT_NODE || node.nodeName === 'BR';
    }
    /**
     * Get the current range from the current selection in DOM. If there is no
     * range in the DOM, return a fake one at offset 0 of the editable element.
     * If an event is given, then the range must be at least partially
     * contained in the target of the event, otherwise it means it took no
     * part in it. In this case, return the caret position instead.
     *
     * @param [ev]
     */
    _getRange(ev?: MouseEvent | TouchEvent): DomRangeDescription {
        let range: DomRangeDescription;
        const selection = this.editable.ownerDocument.getSelection();
        let ltr: boolean;
        if (!selection || selection.rangeCount === 0) {
            // No selection means no range so a fake one is created
            range = {
                startContainer: this.editable,
                startOffset: 0,
                endContainer: this.editable,
                endOffset: 0,
                direction: Direction.FORWARD,
            };
        } else {
            // The direction of the range is sorely missing from the DOM api.
            const nativeRange = selection.getRangeAt(0);
            if (selection.anchorNode === selection.focusNode) {
                ltr = selection.anchorOffset <= selection.focusOffset;
            } else {
                ltr = selection.anchorNode === nativeRange.startContainer;
            }
            range = {
                startContainer: nativeRange.startContainer,
                startOffset: nativeRange.startOffset,
                endContainer: nativeRange.endContainer,
                endOffset: nativeRange.endOffset,
                direction: ltr ? Direction.FORWARD : Direction.BACKWARD,
            };
        }

        // If an event is given, then the range must be at least partially
        // contained in the target of the event, otherwise it means it took no
        // part in it. In this case, consider the caret position instead.
        // This can happen when target is an input or a contenteditable=false.
        if (ev && ev.target instanceof Node) {
            const target = ev.target;
            if (!target.contains(range.startContainer) && !target.contains(range.endContainer)) {
                const caretPosition = this._locateEvent(ev);
                range = {
                    startContainer: caretPosition.offsetNode,
                    startOffset: caretPosition.offset,
                    endContainer: caretPosition.offsetNode,
                    endOffset: caretPosition.offset,
                    direction: Direction.FORWARD,
                };
            }
        }

        return range;
    }
    /**
     * Return true if the given range is interpreted like a
     *
     * @param range
     */
    _isSelectAll(range: DomRangeDescription): boolean {
        let startContainer = range.startContainer;
        let startOffset = range.startOffset;
        let endContainer = range.endContainer;
        let endOffset = range.endOffset;

        const body = this.editable.ownerDocument.body;
        // The selection might still be on a node which has since been removed
        const invalidStart = !startContainer || !body.contains(startContainer);
        const invalidEnd = !endContainer || !body.contains(endContainer);
        const invalidSelection = invalidStart || invalidEnd;

        // The range might be collapsed in which case there is no selection
        const onlyOneNodeSelected = startContainer === endContainer;
        const noCharacterSelected = startOffset === endOffset;
        const collapsedRange = onlyOneNodeSelected && noCharacterSelected;

        // If the selection is invalid or the range is collapsed, it definitely
        // does not correspond to a select all action.
        if (invalidSelection || collapsedRange) {
            return false;
        }

        // TODO: browser don't go to lowest possible depth
        if (startContainer.childNodes[startOffset]) {
            startContainer = startContainer.childNodes[startOffset];
            startOffset = 0;
        }
        if (endContainer.childNodes[endOffset]) {
            endContainer = endContainer.childNodes[endOffset];
            endOffset = 0;
        }

        if (
            startOffset !== 0 ||
            (endContainer.nodeType === Node.TEXT_NODE &&
                endOffset !== endContainer.textContent.length)
        ) {
            return false;
        }
        // Look for visible nodes in editable that would be outside the range.
        return (
            this._isAtVisibleEdge(startContainer, 'start') &&
            this._isAtVisibleEdge(endContainer, 'end')
        );
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
    _isAtVisibleEdge(element: Node, side: 'start' | 'end'): boolean {
        // Start from the top and do a depth-first search trying to find a
        // visible node that would be in editable and beyond the given element.
        let node: Node = this.editable;
        const child = side === 'start' ? 'firstChild' : 'lastChild';
        const sibling = side === 'start' ? 'nextSibling' : 'previousSibling';
        let crossVisible = false;
        while (node) {
            if (node === element) {
                // The element was reached without finding another visible node.
                return !crossVisible;
            }
            if (this._isTextualNode(node) && this._isVisible(node)) {
                // There is a textual node in editable beyond the given element.
                crossVisible = true;
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
    _locateEvent(ev: MouseEvent | TouchEvent): DomLocation {
        const x = ev instanceof MouseEvent ? ev.clientX : ev.touches[0].clientX;
        const y = ev instanceof MouseEvent ? ev.clientY : ev.touches[0].clientY;
        let caretPosition = caretPositionFromPoint(x, y);
        if (!this.editable.contains(caretPosition.offsetNode)) {
            caretPosition = { offsetNode: ev.target as Node, offset: 0 };
        }
        return caretPosition;
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Catch setRange and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onContextMenu(ev: MouseEvent): void {
        clearTimeout(this._setTimeoutID);
        this._setTimeoutID = setTimeout(() => {
            if (!this._rangeHasChanged || this._currentlySelectingAll) {
                return;
            }
            this._initialCaretPosition = this._locateEvent(ev);
            this._triggerEvent({
                events: [
                    {
                        type: 'pointer',
                        target: this._initialCaretPosition,
                        defaultPrevented: ev.defaultPrevented,
                        actions: [
                            this._makePayload('setRange', {
                                domRange: this._getRange(ev),
                            }),
                        ],
                    } as NormalizedPointerEvent,
                ],
                mutatedElements: new Set([]),
            });
            this._rangeHasChanged = false;
        }, 0);
        // The _mousedownInEditable property is used to assess whether the user
        // is currently changing the selection by using the mouse. If the
        // context menu ends up opening, the user is definitely not selecting.
        this._initialMousedownInEditable = false;
    }
    /**
     * Catch Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {KeyboardEvent} ev
     */
    _onKeyDownOrKeyPress(ev: KeyboardEvent): void {
        this._registerEvent(ev);
        const range = this._getRange();
        const node = range.startContainer.childNodes[range.startOffset];
        this._initialCaretPosition = {
            offsetNode: node || range.startContainer,
            offset: node ? 0 : range.startOffset,
        };
    }
    /**
     * Catch setRange and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onPointerDown(ev: MouseEvent | TouchEvent): void {
        if (!this.editable.contains(ev.target as Node)) {
            this._initialMousedownInEditable = false;
            this._initialCaretPosition = undefined;
            return;
        }
        this._lastEvents = [ev];
        this._rangeHasChanged = false;
        // store mousedown event to detect range change from mouse selection
        this._initialMousedownInEditable = true;
        // store the caret position of the mousedown
        this._initialCaretPosition = this._locateEvent(ev);
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
        this._lastEvents = [ev];
        if (!this._initialMousedownInEditable) {
            return;
        }
        if ('clientX' in ev) {
            this._initialCaretPosition = this._locateEvent(ev);
        }
        clearTimeout(this._setTimeoutID);
        this._setTimeoutID = setTimeout(() => {
            if (!(ev.target instanceof Element) || !this._rangeHasChanged) {
                this._initialMousedownInEditable = false;
                return;
            }

            const range = this._getRange(ev);
            this._triggerEvent({
                events: [
                    {
                        type: 'pointer',
                        target: this._initialCaretPosition,
                        defaultPrevented: ev.defaultPrevented,
                        actions: [this._makePayload('setRange', { domRange: range })],
                    } as NormalizedPointerEvent,
                ],
                mutatedElements: new Set([]),
            });
        }, 0);
    }
    /**
     * If the drag start event is observed by the normalizer, it means the
     * dragging started in the editable itself. It means the user is dragging
     * content around in the editable zone.
     *
     */
    _onDragStart(): void {
        this._draggingFromEditable = true;
    }
    /**
     * Convert the drop event into a custom pre-processed format in order to
     * store additional information that are specific to this point in time,
     * such as the current range and the initial caret position.
     *
     * @param ev
     */
    _onDrop(ev: DragEvent): void {
        // Prevent default behavior (e.g. prevent file from being opened.)
        ev.preventDefault();

        const transfer = ev.dataTransfer;

        // Extract files using the DataTransferItemList interface.
        const files = [];
        for (let i = 0; i < transfer.items.length; i++) {
            const item = transfer.items[i];
            if (item.kind === 'file') {
                files.push(item.getAsFile());
            }
        }

        const caretPosition = this._locateEvent(ev);
        const params: CustomEventInit<DataTransferDetail> = {
            detail: {
                'text/plain': transfer.getData('text/plain'),
                'text/html': transfer.getData('text/html'),
                'text/uri-list': transfer.getData('text/uri-list'),
                files: files,
                originalEvent: ev,
                // TODO: This looks wrong. Shouldn't it give me the range from
                // where I dragged the stuff if draggingFromEditable is true ?
                range: {
                    startContainer: caretPosition.offsetNode,
                    startOffset: caretPosition.offset,
                    endContainer: caretPosition.offsetNode,
                    endOffset: caretPosition.offset,
                    direction: Direction.FORWARD,
                },
                caretPosition: caretPosition,
                draggingFromEditable: this._draggingFromEditable,
            },
        };
        this._registerEvent(new CustomEvent('drop', params));

        // Dragging is over, reset this property.
        this._draggingFromEditable = false;
    }
    /**
     * Convert the clipboard event into a custom pre-processed format in order
     * to store additional information that are specific to this point in time,
     * such as the current range and the initial caret position.
     *
     * @param ev
     */
    _onClipboard(ev: ClipboardEvent): void {
        if (ev.type === 'paste') {
            // Prevent the default browser wild pasting behavior.
            ev.preventDefault();
        }
        const clipboard = ev.clipboardData;
        const params: CustomEventInit<DataTransferDetail> = {
            detail: {
                'text/plain': clipboard.getData('text/plain'),
                'text/html': clipboard.getData('text/html'),
                'text/uri-list': clipboard.getData('text/uri-list'),
                files: [],
                originalEvent: ev,
                range: this._getRange(),
                caretPosition: this._initialCaretPosition,
                draggingFromEditable: false,
            },
        };
        this._registerEvent(new CustomEvent(ev.type, params));
    }
    /**
     * On each change of selection, check if it might be a "Select All" action.
     *
     * @private
     */
    _onSelectionChange(): void {
        if (!this._initialCaretPosition) {
            // TODO: Remove this once the renderer only re-renders what has
            // changed rather than re-rendering everything. Right now it is
            // needed to avoid an infinite loop when selectAll triggers a new
            // setRange, which triggers a new selection, which loops infinitely.
            return;
        }

        this._rangeHasChanged = true;
        // Testing whether the entire document is selected or not is a costly
        // process, so we use the below heuristics before actually checking.
        let events = this._events;
        if (!events) {
            // On Safari MacOS, the selectionchange event is triggered in the
            // stack following the keyboard events rather than the same one.
            events = this._lastEvents;
        }
        // There are only a few cases where a selection change might actually be
        // a select all. Outside of these cases, there is no need to make the
        // costly check.
        // 1. Following a modified key being pressed. (e.g. Ctrl+A)
        const modifiedKeyEvent = events.find((ev: KeyboardEvent) => {
            return ev.type === 'keydown' && (ev.ctrlKey || ev.metaKey);
        });
        // 2. Following a single pointer action. (e.g. right click > Select All)
        const single = this._lastEvents && this._lastEvents.length === 1;
        const type = single && this._lastEvents[0].type;
        const followsPointerAction = single && pointerEventTypes.includes(type);

        // This heuristic protects against a costly `_isSelectAll` call.
        const heuristic = modifiedKeyEvent || followsPointerAction;
        const isSelectAll = heuristic && this._isSelectAll(this._getRange());

        if (isSelectAll && !this._currentlySelectingAll) {
            if (modifiedKeyEvent) {
                // This select all was triggered from the keyboard. Add a fake
                // selectAll event to the queue as a marker for `_processEvents`
                // to register that a select all was triggered in this stack.
                this._registerEvent(new CustomEvent('selectAll'));
                if (events === this._lastEvents) {
                    // On Safari MacOS, `this._lastEvents` is used for `events`.
                    // In this case, the modified key event is missing from the
                    // current event stack since Safari triggered the change in
                    // the next stack. This fixes the event stack on Safari.
                    this._events.unshift(modifiedKeyEvent);
                }
            } else {
                // The target of the select all specifies where the user caret
                // was when the select all was triggered.
                const selectAll: NormalizedAction = {
                    type: 'selectAll',
                    target: this._initialCaretPosition,
                    domRange: this._getRange(),
                };
                // In this case, the select all was triggered from the pointer.
                const normalizedPointerEvent: NormalizedPointerEvent = {
                    type: 'pointer',
                    target: this._initialCaretPosition,
                    defaultPrevented: false,
                    actions: [selectAll],
                };
                // We did not find any case where a select all triggered from
                // the mouse actually resulted in a mutation, so the mutation
                // normalizer is not listnening in this case. If it happens to
                // be insufficient later on, the mutated elements will need to
                // be retrieved from the mutation normalizer.
                this._triggerEvent({
                    events: [normalizedPointerEvent],
                    mutatedElements: new Set(),
                });
            }
        }
        // Safari on MacOS triggers a selection change when pressing Ctrl even
        // though the selection did not actually change. This property is used
        // to store whether the current state is considered to be a select all.
        // The point is to avoid triggering a new event for a selection change
        // if everything was already selected beforehand.
        this._currentlySelectingAll = isSelectAll;
    }
}
