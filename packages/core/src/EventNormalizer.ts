import { Direction } from '../../core/src/VSelection';
import { MutationNormalizer } from './MutationNormalizer';
import { caretPositionFromPoint } from '../../utils/polyfill';
import { targetDeepest } from '../../utils/src/Dom';

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

export interface DomSelectionDescription {
    readonly anchorNode: Node;
    readonly anchorOffset: number;
    readonly focusNode: Node;
    readonly focusOffset: number;
    readonly direction: Direction;
    origin?: string; // origin of the selection change
}

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
 * Regexp to test if a character is within an alphabet known by us.
 *
 * Note: Not all alphabets are taken into consideration and this RegExp is subject to be completed
 *       as more alphabets will be covered.
 *
 * Unicode range source:
 * - wikipedia
 * - google translate
 * - https://jrgraphix.net/r/Unicode/
 *
 * Tool to generate RegExp range:
 * - https://apps.timwhitlock.info/js/regex
 *
 * The strategy is to separate any word by selecting subsequent characters of a common alphabet.
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

const multiKeyEvents = ['keydown', 'keypress', 'input'];

/**
 * These javascript event types might, in case of safari or spell-checking
 * keyboard, trigger dom events in multiple javascript stacks. They will require
 * to observe events during two ticks rather than after a single tick.
 */
const MultiStackEventTypes = ['input', 'compositionend', 'selectAll'];

interface InsertTextAction {
    type: 'insertText';
    text: string;
    // ? do we keep the `html` key?
    html?: string;
}

// ? why do we have InsertHtml if we have insertText?
interface InsertHtmlAction {
    type: 'insertHtml';
    html: string;
    text: string;
}

interface InsertParagraphBreakAction {
    type: 'insertParagraphBreak';
}

interface InsertFilesAction {
    type: 'insertFiles';
    files: File[];
}

interface DeleteContentAction {
    type: 'deleteContent';
    direction: Direction;
}
export interface DeleteWordAction {
    type: 'deleteWord';
    direction: Direction;
    text: string;
}

interface DeleteHardLineAction {
    type: 'deleteHardLine';
    direction: Direction;
    domSelection: DomSelectionDescription;
}

interface SelectAllAction {
    type: 'selectAll';
    carretPosition: CaretPosition;
    domSelection: DomSelectionDescription;
}

interface SetSelectionAction {
    type: 'setSelection';
    domSelection: DomSelectionDescription;
}

interface ApplyFormatAction {
    type: 'applyFormat';
    format: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any; //todo: remove any
}

interface HistoryAction {
    type: 'historyUndo' | 'historyRedo';
}

export type NormalizedAction =
    | InsertTextAction
    | InsertHtmlAction
    | InsertParagraphBreakAction
    | InsertFilesAction
    | DeleteContentAction
    | DeleteWordAction
    | DeleteHardLineAction
    | SelectAllAction
    | SetSelectionAction
    | ApplyFormatAction
    | HistoryAction;

export interface CaretPosition {
    offsetNode: Node;
    offset: number;
}

/**
 * One eventBatch contain all element being triggered and normalized from one or more events stacks
 * (in case of safari)
 */
export interface EventBatch {
    // We currently only need an array of event in case of multikeypress.
    actions: NormalizedAction[];
    mutatedElements?: Set<Node>;
}

interface DataTransferDetails {
    type: 'drop' | 'paste' | 'cut';
    'text/plain': string;
    'text/html': string;
    'text/uri-list': string;
    files: File[];
    originalEvent: Event;
    draggingFromEditable: boolean;
    caretPosition: CaretPosition;
    selection: DomSelectionDescription;
}
/**
 * The event to process in `_processEvents` could be a native `Event` or a custom event that we
 * created (`DataTransferDetails`).
 */
type EventToProcess = Event | DataTransferDetails;

interface EventListenerDeclaration {
    readonly target: EventTarget;
    readonly type: string;
    readonly listener: EventListener;
}

interface CompositionData {
    compositionFrom: string;
    compositionTo: string;
    actions: NormalizedAction[];
}

type TriggerEventBatchCallback = (batch: EventBatch) => void;

/**
 * ## The problems the normalizer solve
 * Browser and virtual keyboards on mobile does not implement properly the w3c
 * contenteditable specification and are inconsistent.
 *
 * ## Goal of the normalizer
 * 1. Hook any change that happend in an element called the `editable`.
 * 2. Trigger the same event for the same action accross all browsers and
 *    devices.
 *
 * ## Strategy
 * Hook all javascript events that modify the `editable` element. Then, trigger
 * normalized events.
 *
 * ## How to use this normalizer?
 * 1. Javascript Events occurs
 * 2. Normalize javascript one or more `Event` to one or more
 *    `NormalizedAction`.
 * 3. Update our `VDocument` in regard of triggered normalized actions.
 * 4. Render what changed in the `VDocument` HTML in the `editable`.
 *
 * The normalizer does not preventDefault most of the change in the editable
 * happen (the exception for "paste" and "drop" javascript event).
 *
 *
 * ## Handeling javascript events
 * A javascript event is almost never prevented and almost always alter the
 * editable in the DOM.
 *
 * The reason that we do not prevent default is because we need more
 * informations. The information modified in the dom (by observing observing
 * mutations).
 *
 * There is an exception for the event 'paste' and 'drop'.
 *
 * The reason to preventDefault 'paste' is because most of the time, browsers
 * paste content that need to be cleaned. For that reason we prevent it from
 * being inserted in the editable element but the informations can be found in
 * the triggered normalized events actions.
 *
 * The reason to preventDefault 'drop' is because some browsers change page when
 * dropping an image or an url that comes from the address bar (e.g. chrome).
 *
 * ## Supported browser and virtual keyboard
 * - Mac
 *   - Chrome
 *   - Firefox
 *   - Edge
 *   - Safari
 * - Windows
 *   - Chrome
 *   - Firefox
 *   - Edge
 *   - Safari
 * - Linux
 *   - Chrome
 *   - Firefox
 * - Android
 *   - Chrome
 *   - Firefox
 *   - Google keyboard
 *   - Swift keyboard
 * - IOS
 *   - Safari
 *   - Chrome
 *   - Firefox
 */

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
     * _events with value null mean that we are not currently observing changes.
     */
    _events: EventToProcess[] = null;
    /**
     * Map is used to gather informations when multiples keys are found in the
     * same stack.
     */
    _multiKeyStack: {
        keydown?: KeyboardEvent;
        keypress?: KeyboardEvent;
        input?: InputEvent;
    }[] = [];
    /**
     * Map used to collect information about the last events of a type that
     * happened in one or two ticks.
     */
    _eventsMap: {
        keydown?: KeyboardEvent;
        keypress?: KeyboardEvent;
        input?: InputEvent;
        lastComposition?: CompositionEvent;
        compositionstart?: CompositionEvent;
        compositionupdate?: CompositionEvent;
        compositionend?: CompositionEvent;
        cut?: DataTransferDetails;
        drop?: DataTransferDetails;
        paste?: DataTransferDetails;
        customSelectAll?: CustomEvent;
    } = {};

    /**
     * Used in `_onSelectionChange` for the heurisic that check if we might
     * select all the `editable`
     */
    _followsPointerAction: boolean;
    /**
     * In some cases, the observation must be delayed to the next tick. In these
     * cases, this control variable will be set to true such that the analysis
     * process knows the current event queue processing has been delayed.
     */
    _secondTickObservation = false;
    /**
     * Callback function to trigger for each user action.
     */
    _triggerEventBatch: TriggerEventBatchCallback;
    /**
     * Whether the current state of the selection is already recognized as being
     * a "select all".
     */
    _currentlySelectingAll: boolean;
    /**
     * Original mousedown event from which the current selection was made.
     */
    _clickedInEditable: boolean;
    /**
     * Original selection target before the current selection is updated.
     */
    _initialCaretPosition: CaretPosition;
    /**
     * Set to true when `_onSelectionChange`. If set, don't process
     * `_onContextMenu`.
     */
    _selectionHasChanged: boolean;
    /**
     * Whether the current dragging operation started from inside the editable.
     * False if the dragging started outside of the editable.
     */
    _draggingFromEditable: boolean;
    /**
     * When the users clicks in the DOM, the range is set in the next tick.
     * The observation of the resulting range must thus be delayed to the next
     * tick as well. This variable stores the return value of the `setTimeout`
     * call in order to `clearTimeout` it later on.
     */
    _clickTimeout: number;

    constructor(editable: HTMLElement, callback: TriggerEventBatchCallback) {
        this.editable = editable;
        this._triggerEventBatch = callback;

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
     * After a tick (setTimeout 0ms) the '_processEvents' method is called. All
     * events that happened during the tick are read from the queue and the
     * analysis tries to extract the actions desired by the user such as insert,
     * delete, backspace, spell checking, special characters, etc.
     *
     * @see _processEvents
     * @private
     */
    _registerEvent(ev: EventToProcess): void {
        if (this._events === null) {
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

        // It is possible to have multiples keys that must trigger multiples
        // times that are being push in the same tick. To be able to handle this
        // case in `_processEvents`, we aggregate the informations in
        // `_keydownMap`.
        if (multiKeyEvents.includes(ev.type)) {
            // In the multiple key case, a 'keydown' is always the first event
            // triggered between the three (keydown, keypress, input).  So we
            // create a new map each time a 'keydown' is registred.
            if (ev.type === 'keydown') {
                this._multiKeyStack.push({});
            }
            const lastMultiKeys = this._multiKeyStack[this._multiKeyStack.length - 1];
            if (lastMultiKeys) {
                lastMultiKeys[ev.type] = ev;
            }
        }

        this._eventsMap[ev.type] = ev;
        if (ev.type.startsWith('composition')) {
            // Most of the time only need the last composition of the registred
            // events
            this._eventsMap.lastComposition = ev as CompositionEvent;
        }
        this._events.push(ev);
    }
    /**
     * This function is the root of the normalization for most events.
     *
     * Process the events registered with `_regiterEvent` and call
     * `_triggerEventBatch` with one or more `NormalizedEvent` when sufficient
     * information has been gathered from all registred events.
     *
     * It could take up to two tick in the browser to gather all the sufficient
     * information. (e.g. Safari)
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

        let normalizedActions: NormalizedAction[] = [];

        const keydownEvent = this._eventsMap.keydown;
        const keypressEvent = this._eventsMap.keypress;
        const inputEvent = this._eventsMap.input;
        const customSelectAllEvent = this._eventsMap.customSelectAll;
        const compositionEvent = this._eventsMap.lastComposition;
        const compositionStartEvent = this._eventsMap.compositionstart;
        const cutEvent = this._eventsMap.cut;
        const dropEvent = this._eventsMap.drop;
        const pasteEvent = this._eventsMap.paste;

        const compositionData = this._getCompositionData(compositionEvent, inputEvent);

        const isGoogleKeyboardBackspace =
            compositionData &&
            compositionData.compositionFrom.slice(0, -1) === compositionData.compositionTo &&
            keydownEvent &&
            keydownEvent.key === 'Unidentified';

        const googleKeyboardKey =
            keydownEvent &&
            keydownEvent.key === 'Unidentified' &&
            inputEvent &&
            inputEvent.inputType === 'insertCompositionText' &&
            compositionStartEvent &&
            compositionStartEvent.data === '' &&
            this._events.filter(event => event.type === 'compositionstart').length === 1 &&
            this._events.filter(event => event.type === 'compositionupdate').length === 2 &&
            this._events.filter(event => event.type === 'compositionend').length === 0 &&
            inputEvent.data[inputEvent.data.length - 1];
        const swiftKeyInsertKey =
            keydownEvent &&
            keydownEvent.key === 'Unidentified' &&
            inputEvent &&
            inputEvent.inputType === 'insertText' &&
            !googleKeyboardKey &&
            this._events.filter(event => event.type === 'input').length === 1 &&
            inputEvent.data;

        //
        // First pass to get the informations
        //
        const key =
            (keypressEvent &&
                keypressEvent.key !== 'Unidentified' &&
                keypressEvent.key !== 'Dead' &&
                keypressEvent.key) ||
            (inputEvent &&
                inputEvent.data !== null &&
                inputEvent.data.length === 1 &&
                inputEvent.data) ||
            (keydownEvent &&
                keydownEvent.key !== 'Unidentified' &&
                keydownEvent.key !== 'Dead' &&
                keydownEvent.key) ||
            (isGoogleKeyboardBackspace && 'Backspace') ||
            googleKeyboardKey ||
            swiftKeyInsertKey ||
            (keydownEvent &&
                keydownEvent.key === 'Unidentified' &&
                this._inferKeyFromInput(inputEvent));
        // in the test "accent (mac safari)", an erroneous code is triggered
        // (BracketLeft).  to prevent the code from being set, we check if a key
        // is dead.
        const isDeadKey = keydownEvent && keydownEvent.key === 'Dead';
        const code =
            !isDeadKey &&
            ((keydownEvent && keydownEvent.code) || (keypressEvent && keypressEvent.code));
        const isAccentMac =
            inputEvent &&
            compositionEvent &&
            compositionEvent.data &&
            compositionEvent.data.length > 0;
        const inputType =
            (cutEvent && 'deleteByCut') ||
            (dropEvent && 'insertFromDrop') ||
            (pasteEvent && 'insertFromPaste') ||
            (isGoogleKeyboardBackspace && 'deleteContentBackward') ||
            (!!googleKeyboardKey && 'insertText') ||
            (inputEvent && inputEvent.inputType) ||
            // todo: Do we really need to set the inputType when making a
            //       "special accent" in mac?
            (isAccentMac && 'insertCompositionText');
        const defaultPrevented =
            (cutEvent && false) ||
            (dropEvent && true) ||
            (pasteEvent && true) ||
            (keydownEvent && keydownEvent.defaultPrevented) ||
            (keypressEvent && keypressEvent.defaultPrevented) ||
            (inputEvent && inputEvent.defaultPrevented);
        const caretPosition =
            (cutEvent && cutEvent.caretPosition) ||
            (dropEvent && dropEvent.caretPosition) ||
            (pasteEvent && pasteEvent.caretPosition) ||
            (inputEvent &&
                inputTypeCommands.has(inputEvent.inputType) &&
                this._initialCaretPosition);

        // In case of accent inserted from a Mac, check the char before was one
        // of the special accent temporarily inserted in the DOM (e.g. '^', '`',
        // ...).
        //
        // todo: Check the following heuristic that check this case could be
        //       erroneous in some case.  In order to be more specific, we might
        //       need to specify exacly thoses accents ('^', '`', ...) rather
        //       than letting go anything that comes from only one char.  Which
        //       would reducte the margin of errors (but might not get them
        //       all).
        const macAccent =
            compositionData &&
            compositionData.compositionFrom.length === 1 &&
            compositionData.compositionTo.length === 1;
        const macAccentOneChar =
            compositionData &&
            compositionData.compositionFrom === '' &&
            compositionData.compositionTo.length === 1;
        const isCompositionKeyboard = macAccentOneChar || macAccent;

        const isVirtualKeyboard =
            (compositionEvent && (key && key.length !== 1)) ||
            isGoogleKeyboardBackspace ||
            !!googleKeyboardKey ||
            !!swiftKeyInsertKey;

        // Compute the set of mutated elements accross all observed events.
        const mutatedElements = this._mutationNormalizer.getMutatedElements();

        // When the browser trigger multiples keydown at once, for each keydown
        // there is always also a keypress and an input that must be present.
        const possibleMultiKeydown = this._multiKeyStack.every(
            keydownMap => keydownMap.keydown && keydownMap.keypress && keydownMap.input,
        );
        // if there is only one _multiKeyMap, it means that there is no
        // multiples keys pushed.
        if (this._multiKeyStack.length > 1 && possibleMultiKeydown) {
            this._multiKeyStack.map(keydownMap => {
                const keyboardAction = this._getKeyboardAction(
                    keydownMap.keydown.key,
                    keydownMap.input.inputType,
                    !!mutatedElements.size,
                    true,
                );
                if (keyboardAction) {
                    normalizedActions.push(keyboardAction);
                }
            });
        } else if (cutEvent) {
            const deleteContentAction: DeleteContentAction = {
                type: 'deleteContent',
                direction: Direction.FORWARD,
            };
            // remove previously parsed keyboard action as we only want to remove
            normalizedActions.push(deleteContentAction);
        }
        if (dropEvent) {
            normalizedActions.push(...this._getDropActions(dropEvent));
        } else if (pasteEvent) {
            normalizedActions.push(this._getDataTransferAction(pasteEvent));
        } else if (
            normalizedActions.length === 0 &&
            ((!compositionEvent && key) || isCompositionKeyboard || isVirtualKeyboard)
        ) {
            if (customSelectAllEvent) {
                normalizedActions.push(this._getSelectAll());
            }

            const keyboardAction = this._getKeyboardAction(key, inputType, !!mutatedElements.size);
            if (keyboardAction) {
                normalizedActions.push(keyboardAction);
            }

            if (macAccent) {
                normalizedActions = compositionData.actions;
            }
        } else if (normalizedActions.length === 0 && compositionData) {
            normalizedActions.push(...compositionData.actions);
        }
        if (inputEvent && inputEvent.inputType && inputEvent.inputType.indexOf('format') === 0) {
            const formatName = inputEvent.inputType.replace('format', '').toLowerCase();

            const applyFormatAction: ApplyFormatAction = {
                type: 'applyFormat',
                format: formatName,
                data: inputEvent.data,
            };

            normalizedActions.push(applyFormatAction);
        } else if (inputEvent && ['historyUndo', 'historyRedo'].includes(inputEvent.inputType)) {
            const historyAction: HistoryAction = {
                type: inputEvent.inputType as 'historyUndo' | 'historyRedo',
            };
            normalizedActions.push(historyAction);
        }

        this._mutationNormalizer.stop();
        this._events = null;

        // Select all on safari does not provide all the informations the first
        // stack so wait for the second one.
        if (!normalizedActions.length && key === 'a' && keydownEvent && keydownEvent.metaKey) {
            return;
        }

        if (normalizedActions.length > 0) {
            this._triggerEventBatch({
                actions: normalizedActions,
                mutatedElements,
            });
        }
        this._secondTickObservation = false;
        this._eventsMap = {};
        this._followsPointerAction = false;
        this._multiKeyStack = [];
    }
    _getCompositionData(
        compositionEvent: CompositionEvent,
        inputEvent: InputEvent,
    ): CompositionData | undefined {
        if (compositionEvent && inputEvent) {
            let compositionDataString: string = compositionEvent.data;

            // Specific case for SwiftKey. Swiftkey add a space in the
            // inputEvent but not in the composition event.
            const isSwiftKeyAutocorrect =
                inputEvent.inputType === 'insertText' &&
                inputEvent.data &&
                inputEvent.data.length === 1 &&
                inputEvent.data !== compositionDataString &&
                inputEvent.data === ' ';
            if (isSwiftKeyAutocorrect) {
                compositionDataString += ' ';
            }

            return this._getCompositionFromString(compositionDataString);
        } else if (inputEvent && inputEvent.inputType === 'insertReplacementText') {
            // safari trigger an input with 'insertReplacementText' when it
            // correct a word.
            return this._getCompositionFromString(inputEvent.data);
        }
    }

    // todo: discuss with DMO, do we still try to infer the key from input?
    _inferKeyFromInput(inputEvent: InputEvent): string {
        // Case for virtual keyboard: Some virtual keyboards does not trigger
        // keydown when a key is pushed but send an input instead.
        //
        // In that case, infer the key that has been pushed from the
        // inputEvent.inputType.
        if (inputEvent.inputType === 'insertParagraph') {
            return 'Enter';
        } else if (inputEvent.inputType === 'deleteContentBackward') {
            return 'Backspace';
        } else if (inputEvent.inputType === 'deleteContentForward') {
            return 'Delete';
        } else if (inputEvent.data && inputEvent.data.length === 1) {
            return inputEvent.data;
        }
    }
    /**
     * Get a keyboard action if something has happned in the DOM (insert,
     * delete, navigation).
     *
     * @param key
     * @param inputType
     * @param hasMutataedElements
     * @param isMultiKey
     */
    _getKeyboardAction(
        key: string,
        inputType: string,
        hasMutatedElements: boolean,
        isMultiKey = false,
    ):
        | InsertTextAction
        | InsertParagraphBreakAction
        | InsertTextAction
        | SetSelectionAction
        | DeleteWordAction
        | DeleteHardLineAction
        | DeleteContentAction {
        const isInsertOrRemoveAction = hasMutatedElements && !inputTypeCommands.has(inputType);
        if (isInsertOrRemoveAction) {
            // Keys ctrl+x or another potential user mapping can trigger an
            // inputType 'deleteByCut'
            if (key === 'Backspace' || key === 'Delete') {
                return this._getRemoveAction(key, inputType, isMultiKey);
            } else if (key === 'Enter') {
                if (inputType === 'insertLineBreak') {
                    const insertTextAction: InsertTextAction = {
                        type: 'insertText',
                        text: '\n',
                        // todo: see with DMO: is it usefull to add the html?
                        html: '<br/>',
                    };
                    return insertTextAction;
                } else {
                    // todo: see with DMO: is it really necessary as we can infer it from the
                    //       previous action?
                    const insertParagraphAction: InsertParagraphBreakAction = {
                        type: 'insertParagraphBreak',
                    };
                    return insertParagraphAction;
                }
            } else if (key.length === 1) {
                const insertTextAction: InsertTextAction = {
                    type: 'insertText',
                    text: key,
                };
                return insertTextAction;
            }
        } else if (navigationKey.has(key)) {
            const setSelectionAction: SetSelectionAction = {
                type: 'setSelection',
                // Set the range according to the current one. Set the origin
                // key in order to track the source of the move.
                domSelection: this._getSelection(),
            };
            return setSelectionAction;
        }
    }
    _getDropActions(ev: DataTransferDetails): (DeleteContentAction | SetSelectionAction)[] {
        const actions = [];
        if (ev.draggingFromEditable && !ev.files.length) {
            const deleteContentAction: DeleteContentAction = {
                type: 'deleteContent',
                direction: Direction.FORWARD,
            };
            actions.push(deleteContentAction);
        }

        const setSelectionAction: SetSelectionAction = {
            type: 'setSelection',
            domSelection: ev.selection,
        };
        actions.push(setSelectionAction);
        actions.push(this._getDataTransferAction(ev));
        return actions;
    }
    /**
     * Extract informations from dataTranser to know what has been done in the
     * DOM and return it a normalizedAction.
     *
     * when drag and dropping, most browsers wrap the element with tags and
     * styles.  And when dropping in the (same or different) browser, there is
     * many differents behavior.
     *
     * Some browser reload the page when dropping (img or link (from status
     * bar)).  For this reason, we block all the content from being added in the
     * editable. (otherwise reloading happen).
     *
     * Note: The user can drag and drop a link or an img, from the browser
     * navigation bar.
     *
     */
    _getDataTransferAction(
        dataTransfer: DataTransferDetails,
    ): InsertFilesAction | InsertHtmlAction | InsertTextAction {
        if (dataTransfer.files.length) {
            const insertFilesAction: InsertFilesAction = {
                type: 'insertFiles',
                files: dataTransfer.files,
            };
            return insertFilesAction;
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
                        // add default content if it's external link
                        element.innerHTML = uri;
                    }
                    const insertHtmlAction: InsertHtmlAction = {
                        type: 'insertHtml',
                        html: element.outerHTML,
                        text: uri,
                    };
                    return insertHtmlAction;
                } else {
                    const insertHtmlAction: InsertHtmlAction = {
                        type: 'insertHtml',
                        html: html,
                        text: uri,
                    };
                    return insertHtmlAction;
                }
            }
            const insertHtmlAction: InsertHtmlAction = {
                type: 'insertHtml',
                html: html && html.replace(/^<meta[^>]+>/, ''),
                text: text,
            };
            return insertHtmlAction;
        }
        if (uri) {
            const insertHtmlAction: InsertHtmlAction = {
                type: 'insertHtml',
                html: '<a href="' + uri + '">' + uri + '</a>',
                text: uri,
            };
            return insertHtmlAction;
        }
        const insertTextAction: InsertTextAction = {
            type: 'insertText',
            text: text,
        };
        return insertTextAction;
    }
    /**
     * Process the given compiled event as a composition to identify the text
     * that was inserted.
     *
     * Attention, there is a case impossible to retrieve the complete
     * information.  In the case of we don't have the event data and mutation
     * and we might have "a b" change from a composition to "a c". We receive
     * the word change "b" to "c" instead of "a b" to "a c".
     *
     * @private
     */
    _getCompositionFromString(compositionData: string): CompositionData {
        const charMap = this._mutationNormalizer.getCharactersMapping();

        let index = charMap.index;
        let insert = charMap.insert;
        let remove = charMap.remove;

        // We didn't found what was the intention or the action because it look
        // the same most of the time (if not in all case) insert and remove will
        // be both empty, other times, ev.data has always priority
        if (insert === remove && compositionData) {
            insert = compositionData;
            remove = compositionData;
        }

        // In mutation:
        // - we get the changes
        // - try to extract the word or a part of the word (with or without
        //   position)
        // - locate: where the change has been made

        const selection = this._getSelection();
        // if index === -1 it means we could not find the position in the mutated elements
        if (index === -1) {
            // It is possible that the index of the observed change are
            // undefined
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
            // to find the index of the proper character.
            insertEnd += selection.focusOffset;
            index = insertEnd - insert.length;
        } else {
            // it's the index not yet finished
            let offset = index + insert.length - 1;
            if (
                charMap.current.nodes[offset] &&
                (selection.focusNode !== charMap.current.nodes[offset] ||
                    selection.focusOffset !== charMap.current.offsets[offset] + 1)
            ) {
                offset++;
                while (
                    charMap.current.nodes[offset] &&
                    (selection.focusNode !== charMap.current.nodes[offset] ||
                        selection.focusOffset > charMap.current.offsets[offset])
                ) {
                    const text = charMap.current.chars[offset];
                    insert += text;
                    remove += text;
                    offset++;
                }
            }
        }

        const before = charMap.previous.chars.slice(0, index);
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
            // when a virtual keyboard (at least swiftKey) add a space at the
            // end of each composition in that case the insert will be ' '. So
            // we filter out these events
        } else if (
            compositionData &&
            insert &&
            (remove || insert !== ' ') &&
            compositionData !== insert
        ) {
            const charIndex = compositionData.lastIndexOf(insert);
            if (charIndex !== -1) {
                index -= charIndex;
                insert = compositionData;
                const len = remove.length + charIndex;
                remove = charMap.previous.chars.slice(index, index + len + 1);
            }
        }

        // Virtual keyboard that add space (e.g. SwiftKey)
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

        const previousNodes = charMap.previous.nodes;
        const previousOffsets = charMap.previous.offsets;
        const lastPreviousNode = previousNodes[previousNodes.length - 1];
        const lastPreviousOffset = previousOffsets[previousOffsets.length - 1] + 1;
        const offsetEnd = index + rawRemove.length;
        const setSelectionAction: SetSelectionAction = {
            type: 'setSelection',
            domSelection: {
                anchorNode: previousNodes[index] || lastPreviousNode,
                anchorOffset:
                    index in previousOffsets ? previousOffsets[index] : lastPreviousOffset,
                focusNode: previousNodes[offsetEnd] || lastPreviousNode,
                focusOffset:
                    offsetEnd in previousOffsets ? previousOffsets[offsetEnd] : lastPreviousOffset,
                direction: Direction.FORWARD,
            },
        };
        const insertTextAction: InsertTextAction = {
            type: 'insertText',
            text: rawInsert,
        };
        const actions = [setSelectionAction, insertTextAction];

        if (hasEndSpace) {
            if (hadEndSpace) {
                index += rawRemove.length;

                const setSelectionAction: SetSelectionAction = {
                    type: 'setSelection',
                    domSelection: {
                        anchorNode: previousNodes[index],
                        anchorOffset: previousOffsets[index],
                        focusNode: previousNodes[offsetEnd],
                        focusOffset: previousOffsets[index + 1],
                        direction: Direction.FORWARD,
                    },
                };
                actions.push(setSelectionAction);
            }
            const insertTextAction: InsertTextAction = {
                type: 'insertText',
                text: ' ',
            };
            actions.push(insertTextAction);
        }

        return {
            compositionFrom: remove,
            compositionTo: insert,
            actions: actions,
        };
    }
    /**
     * Process the given compiled event as a backspace/delete to identify the
     * text that was removed and return an array of the corresponding
     * NormalizedAction.
     *
     * In the case of cut event, the direction will be `Direction.FORWARD`.
     *
     * @private
     */
    _getRemoveAction(
        key: string,
        inputType: string,
        isMultiKey: boolean,
    ): DeleteWordAction | DeleteHardLineAction | DeleteContentAction {
        // ? why do we set the direction instead of just letting the event continue and being
        // the same name as the input events API?

        const direction = key === 'Backspace' ? Direction.BACKWARD : Direction.FORWARD;
        // Get characterMapping to retrieve which word has been deleted.
        const characterMapping = this._mutationNormalizer.getCharactersMapping();
        // todo: check if we can remove this condition or get rid of `isMultiKey`
        if (!isMultiKey && characterMapping.insert === characterMapping.remove) {
            return;
        }

        const isSwiftKeyDeleteWord =
            (inputType === 'deleteContentForward' || inputType === 'deleteContentBackward') &&
            characterMapping.remove.length > 1;

        if (
            inputType === 'deleteWordForward' ||
            inputType === 'deleteWordBackward' ||
            isSwiftKeyDeleteWord
        ) {
            const deleteWordAction: DeleteWordAction = {
                type: 'deleteWord',
                direction: direction,
                text: characterMapping.remove,
            };
            return deleteWordAction;
        }
        if (
            inputType === 'deleteHardLineForward' ||
            inputType === 'deleteHardLineBackward' ||
            inputType === 'deleteSoftLineForward' ||
            inputType === 'deleteSoftLineBackward'
        ) {
            // todo: come to see me later
            const deleteHardLineAction: DeleteHardLineAction = {
                type: 'deleteHardLine',
                direction: direction,
                domSelection: {
                    anchorNode: characterMapping.previous.nodes[characterMapping.index],
                    anchorOffset: characterMapping.previous.offsets[characterMapping.index],
                    focusNode:
                        characterMapping.previous.nodes[
                            characterMapping.index + characterMapping.remove.length - 1
                        ],
                    focusOffset:
                        characterMapping.previous.offsets[
                            characterMapping.index + characterMapping.remove.length - 1
                        ] + 1,
                    // todo: why DeleteHardLineAction has a direction as well as DeleteHardLineAction.domRange
                    direction: direction,
                },
            };
            return deleteHardLineAction;
        }
        const deleteContentAction: DeleteContentAction = {
            type: 'deleteContent',
            direction: direction,
        };
        return deleteContentAction;
    }
    /**
     * @private
     * @param {KeyboardEvent} ev
     * @returns CompiledEvent
     */
    _getSelectAll(): SelectAllAction {
        const selectAllAction: SelectAllAction = {
            type: 'selectAll',
            carretPosition: this._initialCaretPosition,
            domSelection: this._getSelection(),
        };
        return selectAllAction;
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
     * Get the current selection from the DOM. If there is no selection in the
     * DOM, return a fake one at offset 0 of the editable element.
     * If an event is given, then the selection must be at least partially
     * contained in the target of the event, otherwise it means it took no
     * part in it. In this case, return the caret position instead.
     *
     * @param [ev]
     */
    _getSelection(ev?: MouseEvent | TouchEvent): DomSelectionDescription {
        let selectionDescription: DomSelectionDescription;
        const selection = this.editable.ownerDocument.getSelection();

        let leftToRight: boolean;
        if (!selection || selection.rangeCount === 0) {
            // No selection in the DOM. Create a fake one.
            selectionDescription = {
                anchorNode: this.editable,
                anchorOffset: 0,
                focusNode: this.editable,
                focusOffset: 0,
                direction: Direction.FORWARD,
            };
        } else {
            // The selection direction is sorely missing from the DOM api.
            const nativeRange = selection.getRangeAt(0);
            if (selection.anchorNode === selection.focusNode) {
                leftToRight = selection.anchorOffset <= selection.focusOffset;
            } else {
                leftToRight = selection.anchorNode === nativeRange.startContainer;
            }
            selectionDescription = {
                anchorNode: selection.anchorNode,
                anchorOffset: selection.anchorOffset,
                focusNode: selection.focusNode,
                focusOffset: selection.focusOffset,
                direction: leftToRight ? Direction.FORWARD : Direction.BACKWARD,
            };
        }

        // If an event is given, then the range must be at least partially
        // contained in the target of the event, otherwise it means it took no
        // part in it. In this case, consider the caret position instead.
        // This can happen when target is an input or a contenteditable=false.
        if (ev && ev.target instanceof Node) {
            const target = ev.target;
            if (
                !target.contains(selectionDescription.anchorNode) &&
                !target.contains(selectionDescription.focusNode)
            ) {
                const caretPosition = this._locateEvent(ev);
                selectionDescription = {
                    anchorNode: caretPosition.offsetNode,
                    anchorOffset: caretPosition.offset,
                    focusNode: caretPosition.offsetNode,
                    focusOffset: caretPosition.offset,
                    direction: Direction.FORWARD,
                };
            }
        }

        return selectionDescription;
    }
    /**
     * Check if the given range is selecting the whole editable.
     *
     * @param selection
     */
    _isSelectAll(selection: DomSelectionDescription): boolean {
        let startContainer = selection.anchorNode;
        let startOffset = selection.anchorOffset;
        let endContainer = selection.focusNode;
        let endOffset = selection.focusOffset;

        const body = this.editable.ownerDocument.body;
        // The selection might still be on a node which has since been removed.
        const invalidStart = !startContainer || !body.contains(startContainer);
        const invalidEnd = !endContainer || !body.contains(endContainer);
        const invalidSelection = invalidStart || invalidEnd;

        // The selection might be collapsed in which case there is no selection.
        const onlyOneNodeSelected = startContainer === endContainer;
        const noCharacterSelected = startOffset === endOffset;
        const isCollapsed = onlyOneNodeSelected && noCharacterSelected;

        // If the selection is invalid or the selection is collapsed, it
        // definitely does not correspond to a select all action.
        if (invalidSelection || isCollapsed) {
            return false;
        }

        // TODO: browser range are not necessarily set `startContainer` and `endContainer` to lowest
        //       possible depth
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

        // Look for visible nodes in editable that would be outside the selection.
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
        return false;
    }
    /**
     * Determine if a node is considered visible.
     */
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
    _locateEvent(ev: MouseEvent | TouchEvent): CaretPosition {
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
     * Catch setSelection and selectAll actions
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onContextMenu(ev: MouseEvent): void {
        window.clearTimeout(this._clickTimeout);
        this._clickTimeout = window.setTimeout(() => {
            if (!this._selectionHasChanged || this._currentlySelectingAll) {
                return;
            }
            this._initialCaretPosition = this._locateEvent(ev);
            const setSelectionAction: SetSelectionAction = {
                type: 'setSelection',
                domSelection: this._getSelection(ev),
            };
            this._triggerEventBatch({
                actions: [setSelectionAction],
                mutatedElements: new Set([]),
            });
            this._selectionHasChanged = false;
        }, 0);
        // The _clickedInEditable property is used to assess whether the user is
        // currently changing the selection by using the mouse. If the context
        // menu ends up opening, the user is definitely not selecting.
        this._clickedInEditable = false;
    }
    /**
     * Catch Enter, Backspace, Delete and insert actions
     *
     * @private
     * @param {KeyboardEvent} ev
     */
    _onKeyDownOrKeyPress(ev: KeyboardEvent): void {
        this._registerEvent(ev);
        const selection = this._getSelection();
        const [offsetNode, offset] = targetDeepest(selection.anchorNode, selection.anchorOffset);
        this._initialCaretPosition = { offsetNode, offset };
    }
    /**
     * Set internal properties of the pointer down event to retrieve them later
     * on when the user stops dragging its selection and the selection has
     * changed.
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onPointerDown(ev: MouseEvent | TouchEvent): void {
        if (!this.editable.contains(ev.target as Node)) {
            this._clickedInEditable = false;
            this._initialCaretPosition = undefined;
        } else {
            this._clickedInEditable = true;
            this._initialCaretPosition = this._locateEvent(ev);
            this._selectionHasChanged = false;

            this._followsPointerAction = true;
            this._eventsMap[ev.type] = ev;
        }
    }
    /**
     * Catch setSelection actions coming from clicks.
     *
     * @param ev
     */
    _onClick(ev: MouseEvent): void {
        this._followsPointerAction = true;

        // Don't trigger events on the editable if the click was done outside of
        // the editable itself or on something else than an element.
        if (!(this._clickedInEditable && ev.target instanceof Element)) return;

        // When the users clicks in the DOM, the range is set in the next tick.
        // The observation of the resulting range must thus be delayed to the
        // next tick as well. Store the data we have now before it gets invalid.
        this._initialCaretPosition = this._locateEvent(ev);

        // clearTimeout(this._clickTimeout);
        this._clickTimeout = window.setTimeout(() => this._analyzeSelectionChange(ev), 0);
    }
    /**
     * Analyze a change of selection to trigger a pointer event for it.
     *
     * @param ev
     */
    _analyzeSelectionChange(ev: MouseEvent): void {
        if (!this._selectionHasChanged) return;

        const setSelectionAction: SetSelectionAction = {
            type: 'setSelection',
            domSelection: this._getSelection(ev),
        };
        this._triggerEventBatch({
            actions: [setSelectionAction],
            mutatedElements: new Set([]),
        });
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
     * ? why do we need to store thoses additional informations?
     *
     * In some browser the drop (maybe) exists. In other browser, we need to
     * fetch it from others eventsf
     *
     * drop:
     * - file
     * - text drag/drop
     *   - from another software
     *   - fromm our vDocument
     * when we paste or drop, the position is hard to get.
     * depending of the browser, the position where is inserted is different.
     * So we need to get the position before it's inserted.
     *
     * some browser add style on the image, the span inconsistently on the drop
     * or paste
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
        const dropEvent: DataTransferDetails = {
            type: 'drop',
            'text/plain': transfer.getData('text/plain'),
            'text/html': transfer.getData('text/html'),
            'text/uri-list': transfer.getData('text/uri-list'),
            files: files,
            originalEvent: ev,
            // TODO: This looks wrong. Shouldn't it give me the range from
            // where I dragged the stuff if draggingFromEditable is true ?
            selection: {
                anchorNode: caretPosition.offsetNode,
                anchorOffset: caretPosition.offset,
                focusNode: caretPosition.offsetNode,
                focusOffset: caretPosition.offset,
                direction: Direction.FORWARD,
            },
            caretPosition: caretPosition,
            draggingFromEditable: this._draggingFromEditable,
        };
        this._registerEvent(dropEvent);

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
        const pasteEvent: DataTransferDetails = {
            type: ev.type as ('cut' | 'paste'),
            'text/plain': clipboard.getData('text/plain'),
            'text/html': clipboard.getData('text/html'),
            'text/uri-list': clipboard.getData('text/uri-list'),
            files: [],
            originalEvent: ev,
            selection: this._getSelection(),
            caretPosition: this._initialCaretPosition,
            draggingFromEditable: false,
        };
        this._registerEvent(pasteEvent);
    }
    /**
     * On each change of selection, check if it might be a "selectAll" action.
     *
     * A "selectAll" action can be triggered by:
     * - The shortcut 'ctrl+a'
     * - From the context menu
     * - A user mapping in the browser?
     * - programmatically?
     * - from somehing else?
     *
     * Why the event "selectAll" matter
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

        this._selectionHasChanged = true;
        // There are only a few cases where a selection change might actually be
        // a select all. Outside of these cases, there is no need to make the
        // costly check.
        // 1. Following a modified key being pressed. (e.g. Ctrl+A)
        const modifiedKeyEvent =
            this._eventsMap.keydown &&
            (this._eventsMap.keydown.ctrlKey || this._eventsMap.keydown.metaKey);

        // This heuristic protects against a costly `_isSelectAll` call.
        const heuristic = modifiedKeyEvent || this._followsPointerAction;
        const isSelectAll = heuristic && this._isSelectAll(this._getSelection());

        if (isSelectAll && !this._currentlySelectingAll) {
            if (modifiedKeyEvent) {
                // This select all was triggered from the keyboard. Add a fake
                // selectAll event to the queue as a marker for `_processEvents`
                // to register that a select all was triggered in this stack.
                this._registerEvent(new CustomEvent('customSelectAll'));
            } else {
                // The target of the select all specifies where the user caret
                // was when the select all was triggered.
                const selectAllAction: SelectAllAction = {
                    type: 'selectAll',
                    carretPosition: this._initialCaretPosition,
                    domSelection: this._getSelection(),
                };

                // We did not find any case where a select all triggered from
                // the mouse actually resulted in a mutation, so the mutation
                // normalizer is not listnening in this case. If it happens to
                // be insufficient later on, the mutated elements will need to
                // be retrieved from the mutation normalizer.
                this._triggerEventBatch({
                    actions: [selectAllAction],
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
