import { Direction } from '../../core/src/VSelection';
import { MutationNormalizer } from './MutationNormalizer';
import { caretPositionFromPoint, elementFromPoint } from '../../utils/src/polyfill';
import { targetDeepest, isTextNode } from '../../utils/src/Dom';
import { nodeName, getDocument, nodeLength } from '../../utils/src/utils';
import { removeFormattingSpace } from '../../utils/src/formattingSpace';

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
const trailingSpace = /\s*$/g;

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

/**
 * Information about the MouseEvent or TouchEvent that represent their
 * positions.
 */
interface PointerEventPosition {
    target: EventTarget;
    x: number;
    y: number;
}

/**
 * These javascript event types might, in case of safari or spell-checking
 * keyboard, trigger dom events in multiple javascript stacks. They will require
 * to observe events during two ticks rather than after a single tick.
 */
const MultiStackEventTypes = ['input', 'compositionend', 'selectAll'];

interface InsertTextAction {
    type: 'insertText';
    text: string;
}

interface InsertHtmlAction {
    type: 'insertHtml';
    html: string;
    text: string;
}

interface InsertParagraphBreakAction {
    type: 'insertParagraphBreak';
}

interface InsertLineBreakAction {
    type: 'insertLineBreak';
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
}

interface SetSelectionAction {
    type: 'setSelection';
    domSelection: DomSelectionDescription;
}

interface ApplyFormatAction {
    type: 'applyFormat';
    format: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

interface HistoryAction {
    type: 'historyUndo' | 'historyRedo';
}

export type NormalizedAction =
    | InsertTextAction
    | InsertHtmlAction
    | InsertLineBreakAction
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
 * The modifiers keys being pushed at a particular time.
 */
export interface ModifierKeys {
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

/**
 * The code that we infer for virtual keyboard that do not provide them.
 */
type InferredCodeValue = 'Enter' | 'Backspace' | 'Delete';

/**
 * The infered keydown event for virtual keboard.
 */
export interface InferredKeydownEvent extends ModifierKeys {
    key: InferredCodeValue;
    code: InferredCodeValue;
}

/**
 * One eventBatch contain all element being triggered and normalized from one or more events stacks
 * (in case of safari)
 */
export interface EventBatch {
    // We currently only need an array of event in case of multikeypress.
    actions: NormalizedAction[];
    mutatedElements?: Set<Node>;
    /**
     * In the case of virtual keyboard, infer the key being pushed for 'Enter',
     * 'Backspace', 'Delete'.
     */
    inferredKeydownEvent?: InferredKeydownEvent;
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
    readonly target: Document | ShadowRoot | Window;
    readonly type: string;
    readonly listener: EventListener;
    readonly capture: boolean;
}

interface CompositionData {
    compositionFrom: string;
    compositionTo: string;
    actions: NormalizedAction[];
}

/**
 * Object containing all events present in one stack.
 */
interface CurrentStackObservations {
    /**
     * Events fired during the current tick.
     * _events with value null mean that we are not currently observing changes.
     */
    _events: EventToProcess[];
    /**
     * Map is used to gather informations when multiples keys are found in the
     * same stack.
     */
    _multiKeyStack: {
        keydown?: KeyboardEvent;
        keypress?: KeyboardEvent;
        input?: InputEvent;
    }[];
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
        keyboardSelectAll?: CustomEvent;
    };
    mutations: MutationRecord[];
}

/**
 * Create a promise that resolve once a timeout finish or when calling
 * `executeAndClear`.
 */
class Timeout<T = void> {
    id: number;
    pending = true;
    promise: Promise<T>;
    private _resolve: Function;

    constructor(public fn: () => T | Promise<T>, interval = 0) {
        this.promise = new Promise((resolve): void => {
            this._resolve = resolve;
            this.id = window.setTimeout(() => {
                this.pending = false;
                resolve(fn());
            }, interval);
        });
    }
    fire(result?: T): void {
        clearTimeout(this.id);
        this.pending = false;
        if (result) {
            this._resolve(result);
        } else {
            this._resolve(this.fn());
        }
    }
}

type TriggerEventBatchCallback = (batch: Promise<EventBatch>) => void;

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
     * Event listeners that are bound in the DOM by the normalizer on creation
     * and unbound on destroy.
     */
    _eventListeners: EventListenerDeclaration[] = [];
    /**
     * The MutationNormalizer used by the normalizer to watch the nodes that are
     * being modified since the normalizer creation until it is drestroyed.
     */
    _mutationNormalizer: MutationNormalizer;

    currentStackObservation: CurrentStackObservations;

    /**
     * Used in `_onSelectionChange` for the heurisic that check if we might
     * select all the `editable`
     */
    _followsPointerAction: boolean;
    /**
     * Whether the current state of the selection is already recognized as being
     * a "select all".
     */
    _currentlySelectingAll: boolean;
    /**
     * Original mousedown event from which the current selection was made.
     */
    _mousedownInEditable: boolean;
    /**
     * Original selection target before the current selection is updated.
     */
    _initialCaretPosition: CaretPosition;
    /**
     * Whether the current dragging operation started from inside the editable.
     * False if the dragging started outside of the editable.
     */
    _draggingFromEditable: boolean;
    /**
     * Cache the state of modifiers keys on each keystrokes.
     */
    _modifierKeys: ModifierKeys = {
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
    };
    /**
     * The current selection has to be observed as a result of a mousedown,
     * mousemove or mouseup or a nagivation key being triggered. However, this
     * cannot be done at the time of the mousedown itself since the browser
     * hasn't updated the selection in the DOM yet.  This observation is thus
     * deferred inside a `setTimeout`. If the browser gets overloaded, it might
     * fire the timeout after other events have happened, thus rendering the
     * observation meaningless since the selection would have changed yet again.
     * The observation timeout is stored in this variable in order to manually
     * fire its execution when an event that might change the selection is
     * triggered before the browser executed the timer.
     */
    _selectionTimeouts: Timeout<EventBatch>[] = [];

    /**
     * This stack represent aggregated event registred through `_registerEvent`.
     */
    _stackTimeout: Timeout<EventBatch>;
    /**
     * Map of the shadow dom event normalizer.
     * If an event is triggered inside a shadow dom, we instanciate a new
     * EventNormalizer in the shadow dom.
     */
    private _shadowNormalizers = new Map<Document | ShadowRoot, EventNormalizer>();
    /**
     * This is a cache of the selection state used only for determining whether
     * a particular deleteContent is actually a deleteWord using the SwiftKey
     * mobile keyboard or not.
     */
    private _swiftKeyDeleteWordSelectionCache?: DomSelectionDescription[] = [];

    /**
     * Track if the mouse is currently down regardless of wether the mouse is in
     * the editable or not.
     */
    private _mousedown = false;
    /**
     * Record the last position of the event mousemove
     */
    private _lastMoveEvent: PointerEventPosition;
    private _lastAction: NormalizedAction;
    /**
     *
     * @param _isInEditable Callback to check if the node is in editable.
     * @param _triggerEventBatchOutside Callback to trigger for each user action.
     */
    constructor(
        private _isInEditable: (node: Node) => boolean,
        private _isInEditor: (node: Node) => boolean,
        private _triggerEventBatchOutside: TriggerEventBatchCallback,
        private root: Document | ShadowRoot = document,
        shadowNormalizers?: Map<Document | ShadowRoot, EventNormalizer>,
    ) {
        if (shadowNormalizers) {
            this._shadowNormalizers = shadowNormalizers;
        }

        this._processEventsUpUntilMoveEvent();

        this._bindEventInEditable(root, 'compositionstart', this._registerEvent);
        this._bindEventInEditable(root, 'compositionupdate', this._registerEvent);
        this._bindEventInEditable(root, 'compositionend', this._registerEvent);
        this._bindEventInEditable(root, 'beforeinput', this._registerEvent);
        this._bindEventInEditable(root, 'input', this._registerEvent);

        this._bindEvent(root.ownerDocument || root, 'selectionchange', this._onSelectionChange);
        this._bindEventInEditable(root, 'contextmenu', this._onContextMenu);
        this._bindEvent(root, 'mousedown', this._onPointerDown);
        this._bindEvent(root, 'mousemove', this._onPointerMove);
        this._bindEvent(root, 'touchstart', this._onPointerDown);
        this._bindEvent(root, 'load-iframe', this._onEventEnableNormalizer);
        this._bindEvent(root, 'mousedown', this._onEventEnableNormalizer);
        this._bindEvent(root, 'touchstart', this._onEventEnableNormalizer);
        this._bindEvent(root, 'mouseup', this._onPointerUp);
        this._bindEvent(root, 'touchmove', this._onPointerMove);
        this._bindEvent(root, 'touchend', this._onPointerUp);
        this._bindEventInEditable(root, 'keydown', this._onKeyDownOrKeyPress);
        this._bindEventInEditable(root, 'keypress', this._onKeyDownOrKeyPress);
        this._bindEvent(root, 'onkeyup', this._updateModifiersKeys);

        this._bindEventInEditable(root, 'cut', this._onClipboard);
        this._bindEventInEditable(root, 'paste', this._onClipboard);
        this._bindEventInEditable(root, 'dragstart', this._onDragStart);
        this._bindEventInEditable(root, 'drop', this._onDrop);

        this._mutationNormalizer = new MutationNormalizer(
            root instanceof Document ? root.body : root.lastElementChild,
        );

        // Create EventNormalizer for all already loaded iframes.
        for (const iframe of root.querySelectorAll('iframe')) {
            this._enableNormalizer(iframe);
        }
    }
    /**
     * Called when destroy the event normalizer.
     * Remove all added handlers.
     *
     */
    destroy(): void {
        this._mutationNormalizer.destroy();
        this._unbindEvents();
        const eventNormalisers = [...this._shadowNormalizers.values()];
        this._shadowNormalizers.clear();
        for (const eventNormalizer of eventNormalisers) {
            eventNormalizer.destroy();
        }
        this._triggerEventBatch = null;
        this._isInEditable = null;
    }
    /**
     * Process the event timeouts.
     *
     * When an event will happen outside the editor in concurency settings, we
     * might need to capture the selection before the external event happen.
     * Otherwise the external event could be triggered on a wrong selection.
     * Also, we need to slice the `_currentStackObservation` to let characters
     * typed after the external command being sent after the external command.
     */
    processEventTimeouts(): void {
        // Set to false because it will not be a selectAll.
        this._followsPointerAction = false;
        this._processEventsUpUntilMoveEvent();
        // When the external event will be triggered, we do not know what kind
        // of change it has made in the document. We save the information by
        // setting the lastAction being undefined.
        this._lastAction = undefined;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Bind the occurence of given even type on the given target element to the
     * given listener function. See _unbindEvents to unbind all events bound by
     * calling this function.
     *
     * @param target element on which to listen for events
     * @param type of the event to listen
     * @param listener to call when the even occurs on the target
     */
    _bindEvent(
        target: Document | ShadowRoot | Window,
        type: string,
        listener: Function,
        capture = true,
    ): void {
        const boundListener = (ev: EventToProcess): void => {
            if ('target' in ev) {
                const evTarget = ev.target as Element;
                if (
                    evTarget.shadowRoot &&
                    this._shadowNormalizers.has(evTarget.shadowRoot) &&
                    (ev.currentTarget as Node).contains(ev.target as Node)
                ) {
                    return;
                }
            }
            listener.call(this, ev);
        };
        this._eventListeners.push({
            target: target,
            type: type,
            listener: boundListener,
            capture: capture,
        });
        target.addEventListener(type, boundListener, capture);
    }
    /**
     * Filter event from editable.
     *
     * @see _bindEvent
     *
     * @param target element on which to listen for events
     * @param type of the event to listen
     * @param listener to call when the even occurs on the target
     */
    _bindEventInEditable(target: Document | ShadowRoot, type: string, listener: Function): void {
        const boundEditableListener = (ev: EventToProcess): void => {
            let eventTarget = 'target' in ev && (ev.target as Node);
            if (
                eventTarget instanceof Element &&
                (eventTarget.shadowRoot || nodeName(eventTarget) === 'IFRAME')
            ) {
                this._enableNormalizer(eventTarget);
            } else {
                if (eventTarget && ev.constructor.name === 'MouseEvent') {
                    eventTarget = this._getEventTarget(
                        this._getPointerEventPosition(ev as MouseEvent),
                    );
                } else if (eventTarget && ev.constructor.name === 'TouchEvent') {
                    eventTarget = this._getEventTarget(
                        this._getPointerEventPosition(ev as TouchEvent),
                    );
                } else if (this._isInEditable(eventTarget)) {
                    eventTarget = eventTarget?.ownerDocument.getSelection().focusNode;
                }
                if (eventTarget && this._isInEditable(eventTarget)) {
                    listener.call(this, ev);
                }
            }
        };
        this._bindEvent(target, type, boundEditableListener);
    }
    /**
     * Unbind all events bound by calls to _bindEvent.
     *
     */
    _unbindEvents(): void {
        this._eventListeners.forEach(({ target, type, listener, capture }) => {
            target.removeEventListener(type, listener, capture);
        });
    }
    /**
     * Register given event on the this.currentStackObservation._events queue.
     * If the queue is not yet initialized or has been cleared prior to this
     * call, re-initialize it. After a tick (setTimeout 0ms) the
     * '_processEvents' method is called. All events that happened during the
     * tick are read from the queue and the analysis tries to extract the
     * actions desired by the user such as insert, delete, backspace, spell
     * checking, special characters, etc.
     *
     * @see _processEvents
     */
    _registerEvent(ev: EventToProcess): void {
        this._checkMoveEvent();
        this._triggerSelectionTimeouts();

        const isNavigationEvent =
            ev instanceof KeyboardEvent && ev.type === 'keydown' && navigationKey.has(ev.key);

        if (isNavigationEvent) {
            // We might need to trigger selection event before the navigation.
            this._processEventsUpUntilMoveEvent();
            // Manually triggering the processing of the current stack at this
            // point forces the rendering in the DOM of the result of the
            // observed events. This ensures that the new selection that is
            // eventually going to be set by the browser actually targets nodes
            // that are properly recognized in our abstration, which would not
            // be the case otherwise. See comment on `_stackTimeout`.
            if (this._stackTimeout?.pending) {
                this._stackTimeout.fire();
            }
            // TODO: no rendering in editable can happen before the analysis of
            // the selection. There should be a mechanism here that can be used
            // by the normalizer to block the rendering until this resolves.
            const keyboardSelectionTimeout = new Timeout<EventBatch>(
                async (): Promise<EventBatch> => {
                    return this._getSelectionBatchOnce();
                },
            );
            this._triggerEventBatch(keyboardSelectionTimeout.promise);
            this._selectionTimeouts.push(keyboardSelectionTimeout);
        } else {
            if (this.currentStackObservation._events.length === 0) {
                // The queue is not initialized or has been reset, so this is a
                // new user action. Re-initialize the queue such that the
                // analysis is not polluted by previous observations.

                // this.initNextObservation();
                const stack = this.currentStackObservation;

                // Start observing mutations.
                this._mutationNormalizer.start();
                stack.mutations = this._mutationNormalizer._mutations;

                // All events of this tick will be processed in the next one.
                this._stackTimeout = new Timeout<EventBatch>(
                    (): Promise<EventBatch> => {
                        return this._processEvents(stack);
                    },
                );
                this._triggerEventBatch(this._stackTimeout.promise);
            }

            // It is possible to have multiples keys that must trigger multiples
            // times that are being push in the same tick. To be able to handle
            // this case in `_processEvents`, we aggregate the informations in
            // `_multiKeyStack`.
            if (['keydown', 'keypress', 'input'].includes(ev.type)) {
                // In the multiple key case, a 'keydown' is always the first
                // event triggered between the three (keydown, keypress, input).
                // So we create a new map each time a 'keydown' is registred.
                if (ev instanceof KeyboardEvent && ev.type === 'keydown') {
                    this.currentStackObservation._multiKeyStack.push({});

                    // Drop any selection that is not the last one before input.
                    this._swiftKeyDeleteWordSelectionCache = [
                        this._swiftKeyDeleteWordSelectionCache.pop(),
                    ];
                }
                const lastMultiKeys = this.currentStackObservation._multiKeyStack[
                    this.currentStackObservation._multiKeyStack.length - 1
                ];
                if (lastMultiKeys) {
                    lastMultiKeys[ev.type] = ev;
                }
            }

            this.currentStackObservation._eventsMap[ev.type] = ev;
            if (ev.type.startsWith('composition')) {
                // In most cases we only need the last composition of the
                // registred events
                this.currentStackObservation._eventsMap.lastComposition = ev as CompositionEvent;
            }
            this.currentStackObservation._events.push(ev);
        }
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
     */

    /**
     * In some cases, the observation must be delayed to the next tick. In these
     * cases, this control variable will be set to true such that the analysis
     * process knows the current event queue processing has been delayed.
     */
    async _processEvents(
        currentStackObservation: CurrentStackObservations,
        secondTickObservation = false,
    ): Promise<EventBatch> {
        // In some cases, for example cutting with Cmd+X on Safari, the browser
        // triggers events in two different stacks. In such cases, observing
        // events occuring during one tick is not enough so we need to delay the
        // analysis after we observe events during two ticks instead.
        const needSecondTickObservation = currentStackObservation._events.every(ev => {
            return !MultiStackEventTypes.includes(ev.type);
        });
        if (needSecondTickObservation && !secondTickObservation) {
            return await new Promise((resolve): void => {
                setTimeout((): void => {
                    resolve(this._processEvents(currentStackObservation, true));
                });
            });
        }

        let normalizedActions: NormalizedAction[] = [];

        const keydownEvent = currentStackObservation._eventsMap.keydown;
        const keypressEvent = currentStackObservation._eventsMap.keypress;
        const inputEvent = currentStackObservation._eventsMap.input;
        const keyboardSelectAllEvent = currentStackObservation._eventsMap.keyboardSelectAll;
        const compositionEvent = currentStackObservation._eventsMap.lastComposition;
        const cutEvent = currentStackObservation._eventsMap.cut;
        const dropEvent = currentStackObservation._eventsMap.drop;
        const pasteEvent = currentStackObservation._eventsMap.paste;

        const compositionData = this._getCompositionData(
            currentStackObservation.mutations,
            compositionEvent,
            inputEvent,
        );

        const isGoogleKeyboardBackspace =
            compositionData &&
            compositionData.compositionFrom.slice(0, -1) === compositionData.compositionTo &&
            keydownEvent &&
            keydownEvent.key === 'Unidentified';

        const inferredKeydownEvent: InferredKeydownEvent =
            keydownEvent &&
            keydownEvent.key === 'Unidentified' &&
            this._inferKeydownEvent(inputEvent);
        //
        // First pass to get the informations
        //
        const key: string =
            (keypressEvent &&
                keypressEvent.key !== 'Unidentified' &&
                keypressEvent.key !== 'Dead' &&
                keypressEvent.key) ||
            (inputEvent && inputEvent.data?.length === 1 && inputEvent.data) ||
            (keydownEvent &&
                keydownEvent.key !== 'Unidentified' &&
                keydownEvent.key !== 'Dead' &&
                keydownEvent.key) ||
            (isGoogleKeyboardBackspace && 'Backspace') ||
            (keydownEvent &&
                keydownEvent.key === 'Unidentified' &&
                inferredKeydownEvent &&
                inferredKeydownEvent.code);
        const inputType =
            (cutEvent && 'deleteByCut') ||
            (dropEvent && 'insertFromDrop') ||
            (pasteEvent && 'insertFromPaste') ||
            (inputEvent && inputEvent.inputType);

        // In case of accent inserted from a Mac, check that the char before was
        // one of the special accent temporarily inserted in the DOM (e.g. '^',
        // '`', ...).
        //
        const compositionReplaceOneChar =
            compositionData &&
            compositionData.compositionFrom.length === 1 &&
            compositionData.compositionTo.length === 1;
        const compositionAddOneChar =
            compositionData &&
            compositionData.compositionFrom === '' &&
            compositionData.compositionTo.length === 1;
        const isCompositionKeyboard = compositionAddOneChar || compositionReplaceOneChar;

        const isVirtualKeyboard = compositionEvent && key && key.length !== 1;

        // Compute the set of mutated elements accross all observed events.
        const mutatedElements = this._mutationNormalizer.getMutatedElements(
            currentStackObservation.mutations,
        );
        this._mutationNormalizer.stop();

        // When the browser trigger multiples keydown at once, for each keydown
        // there is always also a keypress and an input that must be present.
        const possibleMultiKeydown = currentStackObservation._multiKeyStack.every(
            keydownMap =>
                keydownMap.keydown &&
                keydownMap.keydown.key !== 'Unidentified' &&
                (keydownMap.input || keydownMap.keydown.key.length > 1),
        );
        // if there is only one _multiKeyMap, it means that there is no
        // multiples keys pushed.
        if (currentStackObservation._multiKeyStack.length > 1 && possibleMultiKeydown) {
            currentStackObservation._multiKeyStack.map(keydownMap => {
                const keyboardAction = this._getKeyboardAction(
                    currentStackObservation.mutations,
                    keydownMap.keydown.key,
                    (keydownMap.input && keydownMap.input.inputType) || '',
                    !!mutatedElements.size,
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
        } else if (dropEvent) {
            normalizedActions.push(...this._getDropActions(dropEvent));
        } else if (pasteEvent) {
            normalizedActions.push(this._getDataTransferAction(pasteEvent));
        } else if (keyboardSelectAllEvent) {
            const selectAllAction: SelectAllAction = {
                type: 'selectAll',
            };
            normalizedActions.push(selectAllAction);
        } else if (
            normalizedActions.length === 0 &&
            ((!compositionEvent && key) || isCompositionKeyboard || isVirtualKeyboard)
        ) {
            const keyboardAction = this._getKeyboardAction(
                currentStackObservation.mutations,
                key,
                inputType,
                !!mutatedElements.size,
                keydownEvent,
            );
            if (keyboardAction) {
                normalizedActions.push(keyboardAction);
            }

            if (compositionReplaceOneChar) {
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

        this.processEventTimeouts();

        if (normalizedActions.length > 0) {
            const batch: EventBatch = {
                actions: normalizedActions,
                mutatedElements,
            };
            if (inferredKeydownEvent) {
                batch.inferredKeydownEvent = inferredKeydownEvent;
            }
            return batch;
        }
        return { actions: [] };
    }

    /**
     * Process the click, navigation, keydown event and beggin a new
     * `currentStackObservation` to separate it from the previous one.
     *
     * When the system is under pressure, the events will be triggered on the
     * same tick. We need reset the normalizer stack `currentStackObservation`
     * check if there was a move event before and trigger all the timeout.
     */
    _processEventsUpUntilMoveEvent(check = true): void {
        if (check) this._checkMoveEvent();
        this._triggerSelectionTimeouts();

        // See comment on `_stackTimeout`.
        if (this._stackTimeout?.pending) {
            this._stackTimeout.fire();
        }

        this.currentStackObservation = {
            _events: [],
            _multiKeyStack: [],
            _eventsMap: {},
            mutations: undefined,
        };
    }

    _getCompositionData(
        mutations: MutationRecord[],
        compositionEvent: CompositionEvent | undefined,
        inputEvent: InputEvent | undefined,
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

            return this._getCompositionFromString(mutations, compositionDataString);
        } else if (inputEvent && inputEvent.inputType === 'insertReplacementText') {
            // safari trigger an input with 'insertReplacementText' when it
            // correct a word.
            return this._getCompositionFromString(mutations, inputEvent.data);
        }
    }

    /**
     * Infer a `KeyboardEvent` `code` from an `InputEvent`
     */
    _inferKeydownEvent(inputEvent: InputEvent): InferredKeydownEvent {
        let code: InferredCodeValue;
        if (inputEvent.inputType === 'insertParagraph') {
            code = 'Enter';
        } else if (inputEvent.inputType === 'deleteContentBackward') {
            code = 'Backspace';
        } else if (inputEvent.inputType === 'deleteContentForward') {
            code = 'Delete';
        }
        if (code) {
            return {
                ...this._modifierKeys,
                key: code,
                code: code,
            };
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
        mutations: MutationRecord[],
        key: string,
        inputType: string,
        hasMutatedElements: boolean,
        keydownEvent?: KeyboardEvent,
    ):
        | InsertLineBreakAction
        | InsertParagraphBreakAction
        | InsertTextAction
        | DeleteWordAction
        | DeleteHardLineAction
        | DeleteContentAction {
        const isInsertOrRemoveAction = hasMutatedElements && !inputTypeCommands.has(inputType);
        if (isInsertOrRemoveAction) {
            if (key === 'Backspace' || key === 'Delete') {
                return this._getRemoveAction(mutations, key, inputType, keydownEvent);
            } else if (key === 'Enter') {
                if (inputType === 'insertLineBreak') {
                    const insertLineBreakAction: InsertLineBreakAction = {
                        type: 'insertLineBreak',
                    };
                    return insertLineBreakAction;
                } else {
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
        }
    }
    /**
     * Get the actions for a event `ev` of type drop.
     *
     * @param ev
     */
    _getDropActions(ev: DataTransferDetails): (DeleteContentAction | SetSelectionAction)[] {
        const actions = [];
        if (ev.draggingFromEditable && !ev.files.length) {
            const selection = document.getSelection();
            if (!selection.isCollapsed) {
                const deleteContentAction: DeleteContentAction = {
                    type: 'deleteContent',
                    direction: Direction.FORWARD,
                };
                actions.push(deleteContentAction);
            }
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

        if (html && uri) {
            const temp = document.createElement('temp');
            temp.innerHTML = html;
            const element = temp.querySelector('a, img');
            if (element) {
                if (
                    !dataTransfer.draggingFromEditable &&
                    nodeName(element) === 'A' &&
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
        } else if (html) {
            const insertHtmlAction: InsertHtmlAction = {
                type: 'insertHtml',
                // Cross browser drag & drop will add useless meta tag at the
                // beginning of the html.
                html: html && html.replace(/^<meta[^>]+>/, ''),
                text: text,
            };
            return insertHtmlAction;
        } else if (uri) {
            const insertHtmlAction: InsertHtmlAction = {
                type: 'insertHtml',
                html: '<a href="' + uri + '">' + uri + '</a>',
                text: uri,
            };
            return insertHtmlAction;
        } else {
            const insertTextAction: InsertTextAction = {
                type: 'insertText',
                text: text,
            };
            return insertTextAction;
        }
    }
    /**
     * Process the composition to identify the text that was inserted.
     *
     * Attention, there is a case impossible to retrieve the complete
     * information. In the case of we don't have the event data and mutation
     * and we might have "a b" change from a composition to "a c". We receive
     * the word change "b" to "c" instead of "a b" to "a c".
     *
     */
    _getCompositionFromString(
        mutations: MutationRecord[],
        compositionData: string,
    ): CompositionData {
        const charMap = this._mutationNormalizer.getCharactersMapping(mutations);

        // The goal of this function is to precisely find what was inserted by
        // a keyboard supporting spell-checking and suggestions.
        // Example (`|` represents the text cursor):
        //   Previous content: 'My friend Christofe| was here.'
        //   Current content:  'My friend Christophe Matthieu| was here.'
        //   Actual text inserted by the keyboard: 'Christophe Matthieu'

        let index = charMap.index;
        let insert = charMap.insert;
        let remove = charMap.remove;

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
            // to find the index of the character proper.
            insertEnd += selection.focusOffset;
            index = insertEnd - insert.length;
        } else {
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
            // the word is write in a alphabet which contain space, search
            // to complete the change and include the rest of the word
            const beginWord = match[1];
            remove = beginWord + remove;
            insert = beginWord + insert;
            index -= beginWord.length;
            // Some virtual keyboards (e.g. SwiftKey) add a space at the end of
            // each composition such that the insert is ' '. We filter out those
            // events.
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

        // Trim the trailing space added by some virtual keyboards (e.g.
        // SwiftKey).
        const removedEndSpace = remove[remove.length - 1] === ' ';
        const insertedEndSpace = insert[insert.length - 1] === ' ';
        let rawRemove = remove;
        let rawInsert = insert;
        if (insertedEndSpace && removedEndSpace) {
            rawRemove = rawRemove.slice(0, -1);
        }
        if (insertedEndSpace) {
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

        if (insertedEndSpace) {
            if (removedEndSpace) {
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
     */
    _getRemoveAction(
        mutations: MutationRecord[],
        key: string,
        inputType: string,
        keydownEvent: KeyboardEvent,
    ): DeleteWordAction | DeleteHardLineAction | DeleteContentAction {
        const direction = key === 'Backspace' ? Direction.BACKWARD : Direction.FORWARD;

        // Check if this is a deleteWord from the SwiftKey mobile keyboard. This
        // be triggered by long-pressing the backspace key, however SwiftKey
        // does not trigger a proper deleteWord event so we must detect it.
        // This is extremely ad-hoc for the particular case of SwiftKey and we
        // need to retrieve the selection as it was right before the deletion.
        const selection = this._swiftKeyDeleteWordSelectionCache[0];
        this._swiftKeyDeleteWordSelectionCache.length = 0;

        // Get characterMapping to retrieve which word has been deleted.
        const characterMapping = this._mutationNormalizer.getCharactersMapping(mutations);

        const isCollapsed =
            selection &&
            selection.anchorNode === selection.focusNode &&
            selection.anchorOffset === selection.focusOffset;

        const isSwiftKeyDeleteWord =
            (inputType === 'deleteContentForward' || inputType === 'deleteContentBackward') &&
            keydownEvent?.key === 'Unidentified' &&
            isCollapsed &&
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
     * Return true if the given node can be considered a textual node, that is
     * a text node or a BR node.
     *
     * @param node
     */
    _isTextualNode(node: Node): boolean {
        return node.nodeType === Node.TEXT_NODE || nodeName(node) === 'BR';
    }
    /**
     * Get the current selection from the DOM. If an event is given, then the
     * selection must be at least partially contained in the target of the
     * event, otherwise it means it took no part in it. In this case, return the
     * selection from the caret position.
     *
     * @param [ev]
     */
    _getSelection(ev?: PointerEventPosition): DomSelectionDescription | undefined {
        let selectionDescription: DomSelectionDescription;
        let target: Node;
        let root: Document | ShadowRoot;
        if (ev) {
            target = this._getEventTarget(ev);
            root = getDocument(target);
        } else if (this._initialCaretPosition?.offsetNode) {
            root = getDocument(this._initialCaretPosition.offsetNode);
        } else {
            root = document;
        }

        const selection = root.getSelection
            ? root.getSelection()
            : root.ownerDocument.getSelection();

        let forward: boolean;
        if (selection && selection.rangeCount !== 0) {
            // The selection direction is sorely missing from the DOM api.
            const nativeRange = selection.getRangeAt(0);
            if (selection.anchorNode === selection.focusNode) {
                forward = selection.anchorOffset <= selection.focusOffset;
            } else {
                forward = selection.anchorNode === nativeRange.startContainer;
            }
            selectionDescription = {
                anchorNode: selection.anchorNode,
                anchorOffset: selection.anchorOffset,
                focusNode: selection.focusNode,
                focusOffset: selection.focusOffset,
                direction: forward ? Direction.FORWARD : Direction.BACKWARD,
            };
        }

        // If an event is given, then the range must be at least partially
        // contained in the target of the event, otherwise it means it took no
        // part in it. In this case, consider the caret position instead.
        // This can happen when target is an input or a contenteditable=false.
        if (target instanceof Node) {
            const caretPosition = this._getEventCaretPosition(ev);
            if (
                selectionDescription &&
                !target.contains(selectionDescription.anchorNode) &&
                !target.contains(selectionDescription.focusNode) &&
                caretPosition.offsetNode === target
            ) {
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
        // The selection from the context menu or a shortcut never have
        // direction forward.
        if (selection.direction === Direction.BACKWARD) {
            return false;
        }

        let startContainer = selection.anchorNode;
        let startOffset = selection.anchorOffset;
        let endContainer = selection.focusNode;
        let endOffset = selection.focusOffset;
        const doc = startContainer.ownerDocument;

        // The selection might still be on a node which has since been removed.
        let invalidStart = true;
        let domNode = startContainer;
        while (domNode && invalidStart) {
            if (domNode instanceof ShadowRoot) {
                domNode = domNode.host;
            } else if (doc.body.contains(domNode)) {
                invalidStart = false;
            } else {
                domNode = domNode.parentNode;
            }
        }
        let invalidEnd = true;
        domNode = endContainer;
        while (domNode && invalidEnd) {
            if (domNode instanceof ShadowRoot) {
                domNode = domNode.host;
            } else if (doc.body.contains(domNode)) {
                invalidEnd = false;
            } else {
                domNode = domNode.parentNode;
            }
        }
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

        [startContainer, startOffset] = targetDeepest(startContainer, startOffset);
        [endContainer, endOffset] = targetDeepest(endContainer, endOffset);

        // Look for visible nodes in editable that would be outside the range.
        const startInsideEditable = this._isInEditable(startContainer);
        const endInsideEditable = this._isInEditable(endContainer);
        const endLength = isTextNode(endContainer)
            ? removeFormattingSpace(endContainer).replace(trailingSpace, '').length
            : nodeLength(endContainer);
        if (startInsideEditable && endInsideEditable) {
            return (
                startOffset === 0 &&
                this._isAtVisibleEdge(startContainer, 'start') &&
                endOffset >= endLength &&
                this._isAtVisibleEdge(endContainer, 'end')
            );
        } else if (startInsideEditable) {
            return startOffset === 0 && this._isAtVisibleEdge(startContainer, 'start');
        } else if (endInsideEditable) {
            return endOffset >= endLength && this._isAtVisibleEdge(endContainer, 'end');
        } else {
            return true;
        }
    }
    /**
     * Return true if the given element is at the edge of the editable node in
     * the given direction. An element is considered at the edge of the editable
     * node if there is no other visible element in editable that is located
     * beyond it in the given direction.
     *
     * @param node to check whether it is at the visible edge
     * @param side from which to look for textual nodes ('start' or 'end')
     */
    _isAtVisibleEdge(node: Node, side: 'start' | 'end'): boolean {
        const editable: Element = this._getClosestElement(node).closest('[contentEditable=true]');

        // Start from the top and do a depth-first search trying to find a
        // visible node that would be in editable and beyond the given element.
        let currentNode: Node = editable;
        const child = side === 'start' ? 'firstChild' : 'lastChild';
        const sibling = side === 'start' ? 'nextSibling' : 'previousSibling';
        let crossVisible = false;
        while (currentNode) {
            if (currentNode === node) {
                // The element was reached without finding another visible node.
                return !crossVisible;
            }
            if (this._isTextualNode(currentNode) && this._isVisible(currentNode, editable)) {
                // There is a textual node in editable beyond the given element.
                crossVisible = true;
            }
            // Continue the depth-first search.
            if (currentNode[child]) {
                currentNode = currentNode[child];
            } else if (currentNode[sibling]) {
                currentNode = currentNode[sibling];
            } else if (currentNode.parentNode === editable) {
                // Depth-first search has checked all elements in editable.
                return true;
            } else {
                let ancestor = currentNode.parentNode;
                currentNode = ancestor[sibling];
                // When checking from the end we need to go up the ancestors
                // tree to find one which does have a previous sibling.
                while (!currentNode && side === 'end') {
                    ancestor = ancestor.parentNode;
                    currentNode = ancestor[sibling];
                }
            }
        }
        return false;
    }
    /**
     * Determine if a node is considered visible.
     */
    _isVisible(el: Node, editable: Element): boolean {
        if (el === document) {
            return false;
        }
        if (el === editable) {
            // The editable node was reached without encountering a hidden
            // container. The editable node is supposed to be visible.
            return true;
        }
        // A <br> element with no next sibling is never visible.
        if (nodeName(el) === 'BR' && !el.nextSibling) {
            return false;
        }
        const style = window.getComputedStyle(this._getClosestElement(el));
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        return this._isVisible(el.parentNode, editable);
    }
    /**
     * Return the node and offset targeted by a event, including if the target
     * is inside a shadow element
     *
     * @param ev
     */
    _getEventCaretPosition(ev: PointerEventPosition): CaretPosition {
        const target = ev.target as Node;
        let caretPosition = caretPositionFromPoint(ev.x, ev.y, target.ownerDocument);
        if (!caretPosition) {
            caretPosition = { offsetNode: ev.target as Node, offset: 0 };
        }
        return caretPosition;
    }
    /**
     * Use the position to get the target from the event (including the target
     * in shadow element)
     *
     * @param ev
     */
    _getEventTarget(ev: PointerEventPosition): Node {
        const target = ev.target as Node;
        return elementFromPoint(ev.x, ev.y, target.ownerDocument) || target;
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Catch setSelection and selectAll actions
     *
     * @param {MouseEvent} ev
     */
    _onContextMenu(ev: MouseEvent): void {
        this._preProcessPointerEvent(this._getPointerEventPosition(ev));
        // The _clickedInEditable property is used to assess whether the user is
        // currently changing the selection by using the mouse. If the context
        // menu ends up opening, the user is definitely not selecting.
        this._mousedownInEditable = false;
    }
    /**
     * Catch Enter, Backspace, Delete and insert actions
     *
     * @param {KeyboardEvent} ev
     */
    _onKeyDownOrKeyPress(ev: KeyboardEvent): void {
        this._updateModifiersKeys(ev);
        this._registerEvent(ev);
        const selection = this._getSelection();
        if (!selection) {
            this._initialCaretPosition = undefined;
            return;
        }
        const [offsetNode, offset] = targetDeepest(selection.anchorNode, selection.anchorOffset);
        this._initialCaretPosition = { offsetNode, offset };
    }
    /**
     * Set internal properties of the pointer down event to retrieve them later
     * on when the user stops dragging its selection and the selection has
     * changed.
     *
     * @param {MouseEvent} ev
     */
    _onPointerDown(ev: MouseEvent | TouchEvent): void {
        // Don't trigger events on the editable if the click was done outside of
        // the editable itself or on something else than an element.
        const pointerEventPosition = this._getPointerEventPosition(ev);
        const target = this._getEventTarget(pointerEventPosition);
        const caretPosition = this._getEventCaretPosition(pointerEventPosition);
        this._mousedown = true;
        if (target && this._isInEditable(caretPosition.offsetNode)) {
            this._mousedownInEditable = true;
            this._initialCaretPosition = caretPosition;
            this._followsPointerAction = true;

            this._preProcessPointerEvent(this._getPointerEventPosition(ev));
        } else {
            this._mousedownInEditable = false;
            this._initialCaretPosition = undefined;
        }
    }
    /**
     * Catch setSelection actions coming from clicks.
     *
     * @param ev
     */
    _onPointerUp(ev: MouseEvent | TouchEvent): void {
        this._lastMoveEvent = undefined;
        this._mousedown = false;
        this._preProcessPointerEvent(this._getPointerEventPosition(ev));
    }
    /**
     * When the pointer move and a click was previously in the editable, set
     * the variable _lastMoveEvent. See `_checkMoveEvent`.
     */
    _onPointerMove(ev: MouseEvent | TouchEvent): void {
        if (this._mousedown && this._mousedownInEditable) {
            this._lastMoveEvent = this._getPointerEventPosition(ev);
        }
    }
    /**
     *  We need to check the move event for two case that happend directly after
     *  a mousemove:
     *  - An external event happen and the selection could have changed.
     *    Therefore, we need to set the position before the external event
     *    happen.
     *  - A keyboardevent happen and we need to send the last position of the
     *    pointer.
     */
    _checkMoveEvent(): void {
        if (this._lastMoveEvent) {
            this._preProcessPointerEvent(this._lastMoveEvent, false);
            this._lastMoveEvent = undefined;
        }
    }
    /**
     * Analyze a change of selection to trigger a pointer event for it.
     *
     * @param ev
     */
    _getSelectionBatchOnce(ev?: PointerEventPosition): EventBatch {
        const eventBatch = {
            actions: [],
            mutatedElements: new Set([]),
        };

        const selection = this._getSelection(ev);
        if (selection) {
            const selectionAction = this._getSelectionAction(selection);
            if (selectionAction) eventBatch.actions.push(selectionAction);
        }

        return eventBatch;
    }

    /**
     * Get a new selection action only if it differ from the last one.
     */
    _getSelectionAction(selection: DomSelectionDescription): SetSelectionAction | undefined {
        if (this._isLastSelectionDifferent(selection)) {
            const setSelectionAction: SetSelectionAction = {
                type: 'setSelection',
                domSelection: selection,
            };
            return setSelectionAction;
        }
    }
    /**
     * Return a node's parent if it's not an instance of `Element`.
     *
     * @param node
     */
    _getClosestElement(node: Node): Element {
        return node instanceof Element ? node : node.parentElement;
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
     * In some browser we need to infer the drop from other events.
     *
     * Example of droppable object are file, text, url.
     *
     * Drop event can originate from another software, outside the editor zone
     * or inside the editor zone.
     *
     * @param ev
     */
    _onDrop(ev: DragEvent): void {
        // Prevent default behavior (e.g. prevent file from being opened in the
        // current tab).
        ev.preventDefault();

        const transfer = ev.dataTransfer;

        const files = [];
        for (const item of transfer.items) {
            if (item.kind === 'file') {
                files.push(item.getAsFile());
            }
        }

        const caretPosition = this._getEventCaretPosition(ev);
        const dropEvent: DataTransferDetails = {
            type: 'drop',
            'text/plain': transfer.getData('text/plain'),
            'text/html': transfer.getData('text/html'),
            'text/uri-list': transfer.getData('text/uri-list'),
            files: files,
            originalEvent: ev,
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

        const selection = this._getSelection();
        if (!selection) return;

        const pasteEvent: DataTransferDetails = {
            type: ev.type as 'cut' | 'paste',
            'text/plain': clipboard.getData('text/plain'),
            'text/html': clipboard.getData('text/html'),
            'text/uri-list': clipboard.getData('text/uri-list'),
            files: [],
            originalEvent: ev,
            selection: selection,
            caretPosition: this._initialCaretPosition,
            draggingFromEditable: false,
        };
        this._registerEvent(pasteEvent);
    }

    /**
     * Update the modifiers keys to know which modifiers keys are pushed.
     *
     * @param e
     */
    _updateModifiersKeys(e: KeyboardEvent): void {
        this._modifierKeys = {
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
        };
    }
    /**
     * On each change of selection, check if it might be a "selectAll" action.
     *
     * A "selectAll" action can be triggered by:
     * - The shortcut 'CTRL+A'
     * - A user mapping of the OS or browser
     * - From the context menu
     * - Programmatically
     */
    _onSelectionChange(): void {
        if (!this._initialCaretPosition) {
            // Filter the events because we can have some Shadow root and each
            // normaliser bind event on document.
            return;
        }

        if (!this.root.contains(this.root.getSelection().anchorNode)) {
            return;
        }

        const selection = this._getSelection();
        if (!selection) {
            return;
        }

        this._swiftKeyDeleteWordSelectionCache.push(selection);

        const keydownEvent = this.currentStackObservation._eventsMap.keydown;
        const isNavEvent = keydownEvent?.type === 'keydown' && navigationKey.has(keydownEvent.key);
        if (isNavEvent) {
            const navTimeout = new Timeout<EventBatch>(() => {
                const selectionBatch = this._getSelectionBatchOnce();
                return selectionBatch;
            });
            this._triggerEventBatch(navTimeout.promise);
            this._selectionTimeouts.push(navTimeout);
        } else {
            // This heuristic protects against a costly `_isSelectAll` call.
            const modifiedKeyEvent = this._modifierKeys.ctrlKey || this._modifierKeys.metaKey;
            const heuristic = modifiedKeyEvent || this._followsPointerAction;
            const isSelectAll = heuristic && this._isSelectAll(selection);
            if (isSelectAll && !this._currentlySelectingAll) {
                if (modifiedKeyEvent) {
                    // This select all was triggered from the keyboard. Add a
                    // fake selectAll event to the queue as a marker for
                    // `_processEvents` to register that a select all was
                    // triggered in this stack.
                    this._registerEvent(new CustomEvent('keyboardSelectAll'));
                } else {
                    // The target of the select all specifies where the user caret
                    // was when the select all was triggered.
                    const selectAllAction: SelectAllAction = {
                        type: 'selectAll',
                    };

                    // We did not find any case where a select all triggered
                    // from the mouse actually resulted in a mutation, so the
                    // mutation normalizer is not listnening in this case. If it
                    // happens to be insufficient later on, the mutated elements
                    // will need to be retrieved from the mutation normalizer.
                    this._triggerEventBatch(
                        Promise.resolve({
                            actions: [selectAllAction],
                            mutatedElements: new Set(),
                        }),
                    );
                }
            }
            // Safari on MacOS triggers a selection change when pressing Ctrl
            // even though the selection did not actually change. This property
            // is used to store whether the current state is considered to be a
            // select all. The point is to avoid triggering a new event for a
            // selection change if everything was already selected beforehand.
            this._currentlySelectingAll = isSelectAll;
        }
    }
    /**
     * Create an instance of EventNormalizer if the pointer touch a shadow node.
     *
     * @param {MouseEvent} ev
     */
    _onEventEnableNormalizer(ev: MouseEvent | TouchEvent | CustomEvent): void {
        this._enableNormalizer(ev.target as Element);
    }
    /**
     * Create an instance of EventNormalizer for the given element with shadow
     * content or iframe content.
     * To be editable an iframe cannot have src because it must be an iframe
     * with content generated by the editor.
     *
     * @param {Element} el
     */
    private _enableNormalizer(el: Element): void {
        const root =
            el.shadowRoot ||
            (el instanceof HTMLIFrameElement &&
                (!el.src || el.src === window.location.href) &&
                el.contentWindow.document);
        if (root && !this._shadowNormalizers.get(root) && this._isInEditor(el)) {
            const eventNormalizer = new EventNormalizer(
                this._isInEditable,
                this._isInEditor,
                this._triggerEventBatchOutside,
                root,
                this._shadowNormalizers,
            );
            this._shadowNormalizers.set(root, eventNormalizer);
        }
    }

    /**
     * Trigger all selection timeouts. If there is more than one timeout, fire
     * all the previous one with an empty batch as the last selection is the one
     * that count.
     */
    _triggerSelectionTimeouts(): void {
        const lastTimeout = this._selectionTimeouts.pop();
        const emptyBatch: EventBatch = {
            actions: [],
        };
        for (const timeout of this._selectionTimeouts) {
            if (timeout.pending) {
                timeout.fire(emptyBatch);
            }
        }
        if (lastTimeout) {
            lastTimeout.fire();
        }
        this._selectionTimeouts = [];
    }

    /**
     * Make a pointer event under some condition.
     */
    _preProcessPointerEvent(pointerEventPosition: PointerEventPosition, check = true): void {
        // Don't trigger events on the editable if the click was done outside of
        // the editable itself or on something else than an element.
        if (this._mousedownInEditable && pointerEventPosition.target instanceof Element) {
            try {
                this._processEventsUpUntilMoveEvent(check);

                // When the users clicks in the DOM, the range is set in the next
                // tick. The observation of the resulting range must thus be delayed
                // to the next tick as well. Store the data we have now before it
                // gets invalidated by the redrawing of the DOM.
                this._initialCaretPosition = this._getEventCaretPosition(pointerEventPosition);
                const pointerSelectionTimeout = new Timeout<EventBatch>(() => {
                    const selectionBatch = this._getSelectionBatchOnce(pointerEventPosition);
                    return selectionBatch;
                });
                this._triggerEventBatch(pointerSelectionTimeout.promise);
                this._selectionTimeouts.push(pointerSelectionTimeout);
            } catch (e) {
                this._mousedownInEditable = false;
                this._initialCaretPosition = undefined;
            }
        } else if (
            pointerEventPosition.target instanceof Element &&
            !!pointerEventPosition.target.closest('[contentEditable=true]')
        ) {
            // When within a contenteditable element but in a non-editable
            // context, prevent a collapsed selection by removing all ranges.
            // TODO: remove them from the VDocument as well.
            const pointerSelectionTimeout = new Timeout<EventBatch>(() => {
                const selection = this._getSelection();
                if (selection) {
                    const collapsed =
                        selection.anchorNode === selection.focusNode &&
                        selection.anchorOffset === selection.focusOffset;
                    const target = this._getClosestElement(selection.focusNode);
                    if (collapsed && !!target.closest('[contentEditable=true]')) {
                        document.getSelection().removeAllRanges();
                    }
                }
                return {
                    actions: [],
                };
            });
            this._triggerEventBatch(pointerSelectionTimeout.promise);
            this._selectionTimeouts.push(pointerSelectionTimeout);
        }
    }
    /**
     * Middleware betwen the `_triggerEventBatchOutside` to always capture the
     * last action being done when sending a batch.
     */
    _triggerEventBatch(batchPromise: Promise<EventBatch>): void {
        this._triggerEventBatchOutside(
            batchPromise.then(batch => {
                if (batch.actions.length) {
                    this._lastAction = batch.actions[batch.actions.length - 1];
                }
                return batch;
            }),
        );
    }

    /**
     * Check wether the last action is a selection and the selection is the
     * different than the one provided.
     */
    private _isLastSelectionDifferent(selection: DomSelectionDescription): boolean {
        const lastSelection =
            this._lastAction &&
            this._lastAction.type === 'setSelection' &&
            this._lastAction.domSelection;
        if (
            !lastSelection ||
            selection.anchorNode !== lastSelection.anchorNode ||
            selection.anchorOffset !== lastSelection.anchorOffset ||
            selection.direction !== lastSelection.direction ||
            selection.focusNode !== lastSelection.focusNode ||
            selection.focusOffset !== lastSelection.focusOffset
        ) {
            return true;
        }
        return false;
    }

    /**
     * Retrieve a `PointerEventPosition` from a` MouseEvent` or a `TouchEvent`.
     */
    _getPointerEventPosition(ev: MouseEvent | TouchEvent): PointerEventPosition {
        let x: number;
        let y: number;
        if (ev.constructor.name === 'TouchEvent') {
            const change = (ev as TouchEvent).touches[0] || (ev as TouchEvent).changedTouches[0];
            x = change.clientX;
            y = change.clientY;
        } else {
            x = (ev as MouseEvent).clientX;
            y = (ev as MouseEvent).clientY;
        }
        return { x, y, target: ev.target };
    }
}
