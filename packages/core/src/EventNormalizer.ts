import { Direction } from './VRange';
import { MutationNormalizer } from './MutationNormalizer';
import { caretPositionFromPoint } from '../../utils/polyfill';
import { targetDeepest } from '../../utils/src/Dom';

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
 * These javascript event types might, in case of safari or spell-checking
 * keyboard, trigger dom events in multiple javascript stacks. They will require
 * to observe events during two ticks rather than after a single tick.
 * Todo: Link some to case in the documentation
 *
 * Expamples:
 * - Safari need multiples stacks for the input event.
 */
const MultiStackEventTypes = ['input', 'compositionend', 'selectAll'];

export interface DomRangeDescription {
    readonly startContainer: Node;
    readonly startOffset: number;
    readonly endContainer: Node;
    readonly endOffset: number;
    readonly direction: Direction;
}

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

interface InsertParagraphAction {
    type: 'insertParagraph';
}

interface InsertFilesAction {
    type: 'insertFiles';
    files: File[];
}

interface DeleteContentAction {
    type: 'deleteContent';
    direction: Direction;
}
interface DeleteWordAction {
    type: 'deleteWord';
    direction: Direction;
    text: string;
}

interface DeleteHardLineAction {
    type: 'deleteHardLine';
    direction: Direction;
    domRange: DomRangeDescription;
}

interface SelectAllAction {
    type: 'selectAll';
    carretPosition: CaretPosition;
    domRange: DomRangeDescription;
}

interface SetRangeAction {
    type: 'setRange';
    domRange: DomRangeDescription;
}

interface ApplyFormatAction {
    type: 'applyFormat';
    format: string;
    data: any; //todo: remove any
}

interface HistoryAction {
    type: 'historyUndo' | 'historyRedo';
}

export type NormalizedAction =
    | InsertTextAction
    | InsertHtmlAction
    | InsertParagraphAction
    | InsertFilesAction
    | DeleteContentAction
    | DeleteWordAction
    | DeleteHardLineAction
    | SelectAllAction
    | SetRangeAction
    | ApplyFormatAction
    | HistoryAction;

// todo: [refactor] This object is not typed properly. It's not sementically correct.
export interface NormalizedEvent {
    // rename to deviceSource? hardwareSource? source?
    type: string;
    actions: NormalizedAction[]; 
    defaultPrevented: boolean;
    // ? what we do with this key?
    caretPosition?: CaretPosition;
    compositionFrom?: string;
    compositionTo?: string;
    inputType?: string;
}
export interface NormalizedKeyboardEvent extends NormalizedEvent {
    type: 'keyboard';
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

export interface CaretPosition {
    offsetNode: Node;
    offset: number;
}

export interface NormalizedPointerEvent extends NormalizedEvent {
    type: 'pointer';
}

/**
 * One eventBatch contain all element being triggered and normalized from one javascript
 * event stack (or two in some case in javascript)
 */
export interface EventBatch {
    // We currently only need an array of event in the case of multikeypress.
    events: NormalizedEvent[];
    mutatedElements?: Set<Node>;
}

// interface SpecialEventDetails {
//     caretPosition: CaretPosition;
//     actions: NormalizedAction[];
//     defaultPrevented: boolean;
// }

interface DataTransferDetails {
    type: string;
    'text/plain': string;
    'text/html': string;
    'text/uri-list': string;
    files: File[];
    originalEvent: Event;
    draggingFromEditable: boolean;
    caretPosition: CaretPosition;
    range: DomRangeDescription;
}
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
 *
 * ## The problems the normalizer solve
 * Browser and virtual keyboards on mobile does not implement properly the w3c specification and
 * are inconsistent.
 *
 * Here is a non exhaustive list of the differents problems:
 * - No keydown is triggered from virtual keyboard
 * - Drop event refresh the page
 * - Mutation
 * - <todo: list more case>
 *
 * A more compolete list can be found here: <todo: link to the ehaustive list of browsers problems>.
 *
 * ## Goal of the normalizer
 * - To trigger the same event accross all browsers
 * - To hook any change that happend in the (editable)[todo:link_to_the_editable_definition] in the
 *   DOM.
 *
 * ## Strategy
 * Hook all javascript events that 1) modify the editable element or 2) send inconsistents events accross
 * browser. Then, trigger normalized events.
 *
 * To understand the following concepts, let's look at the triggered normalized event.
 *
 * ## Important naming convention
 * ### Editable
 * ### Javascript event
 * ### Compiled event
 * ### Normalized event
 *
 * ## How to use this normalizer?
 * 1) We use the normalizer to update our `VDocument` in regard of triggered normalized events.
 * 2) Once the update in the VDocument has been done, we render the updated `VDocument` to html.
 *    Actually, only a diff of change has been "rendered".
 * 3) Once we have the html diff, we create another diff but this time between the mutated elements
 *    and the diff <todo: complete this informations later with chm>
 *
 * As the normalizer let most of the change in the editable happen (the exception for "paste" and
 * "drop" event) (e.g. a key being inserted).
 * It is the responsibility of the listener of the normalized events to remove dom nodes
 * that are being inserted but not processed
 *
 * ## The Normalized event
 * > Temporary note to make the doc: A draft document that reference all the events, type, eventype
 * > normalized event can be found in the following google sheet:
 * > https://docs.google.com/spreadsheets/d/1jj8lntmr9j5M3HExAbeUF1YeKxjatAupjZ4Wl3MopJU/edit#gid=0
 *
 * The normalized event have tree important key: `type`, `inputType`, `actions`.
 *
 * - (`type`)[todo:link_to_type] provide information about which mecanical device triggered it.
 *   The value can be "keyboard", "pointer" or "composition".
 * - (`inputType`)[todo:link_to_inputType] provide information about the intention of the user.
 *   A complete list of the values can be found below. `inputType` is not present in the normalized
 *   event if the `type` is "composition".
 * - (`actions`)[todo:link_to_actions] provide informations about what happen in the editable in the
 *    DOM. A complete list of values can be found below.
 *
 *
 * ### Type
 * The key `type` provide information about which mecanical device triggered it. The value
 * can be "keyboard", "pointer" or "composition".
 *
 * #### Type "keyboard"
 *
 * The keyboard type is triggered by anything from the keyboard but not necessarily from a
 * javascript keyboard event (keydown, keypress). A keyboard event can come from one of the
 * following javascript event:
 * - keydown
 * - keypress
 * - input
 * - compositionstart
 * - compositionupdate
 * - compositionend
 * - <todo: ask chm to have an exhaustive list>
 * - ...
 *
 * If it's a keyboard event, there is potentially not the `key` and the `code` in case of virtual
 * keyboard.
 *
 * #### Type "pointer"
 * The pointer event can come from:
 * - contextmenu
 * - drop
 * - <todo: ask chm to have an exhaustive list>
 *
 * #### Type "composition"
 * The event is of type composition when we could not get the information if it came from a
 * "keyboard" nor a "pointer".
 *
 * For example:
 * - <todo: ask chm or find examples in tests>
 *
 * A CompiledEvent is of type "composition" if one of the two following rules apply:
 * - The javascript event type is `compositionstart`, `compositionupdate` or `compositionent`
 * - The javascript event type is `input` **and** it's key `inputType`:
 *   - `replacementtext`
 *   - `insertCompositionText`
 *   - `insertFromComposition` (but we don't use it because `insertCompositionText` is sufficient)
 *
 * ## inputType
 * The key `inputType` provide information about the intention of the user. The sementics of the
 * values are the same as the w3c specification (see
 * https://www.w3.org/TR/input-events-2/#interface-InputEvent-Attributes).
 *
 * This key is the most usefull to hook what the user actually wanted to perform.
 *
 * The key `inputType` can be found when the event `type` is "keyboard" or "pointer". Find below
 * a table with all possible `inputType` and with wich `type` they are associated with.
 *
 * | inputType                    | type keyboard | type pointer |
 * |------------------------------|---------------|--------------|
 * | insertText                   |       x       |              |
 * | insertCompositionText        |               |              |
 * | insertParagraph              |               |              |
 * | insertLineBreak              |               |              |
 * | insertFromPaste              |               |              |
 * | insertFromDrop               |               |              |
 * | deleteContentBackward        |               |              |
 * | deleteContentForward         |               |              |
 * | deleteWordBackward           |               |              |
 * | deleteHardLineBackward       |               |              |
 * | deleteWordForward            |               |              |
 * | deleteHardLineForward        |               |              |
 * | deleteByCut                  |               |              |
 * | historyUndo                  |               |              |
 * | historyRedo                  |               |              |
 * | formatBold                   |               |              |
 * | formatItalic                 |               |              |
 * | formatUnderline              |               |              |
 * | formatStrikeThrough          |               |              |
 * | formatSuperscript            |               |              |
 * | formatSubscript              |               |              |
 * | formatJustifyFull            |               |              |
 * | formatJustifyCenter          |               |              |
 * | formatJustifyRight           |               |              |
 * | formatJustifyLeft            |               |              |
 * | formatIndent                 |               |              |
 * | formatOutdent                |               |              |
 * | formatRemove                 |               |              |
 * | formatSetBlockTextDirection  |               |              |
 * | formatSetInlineTextDirection |               |              |
 *
 * We do not handle all inputTypes of the (DOM input event specification)[https://www.w3.org/TR/input-events-2/#interface-InputEvent-Attributes].
 *
 * Some events (such as "formatBackColor", "formatFontColor", "formatFontName") have additional
 * informations attached. We currently do not attach them to the normalized event.
 *
 * Sometimes it is impossible to retrieve the inputType. For instance, when the user has only
 * clicked, and only a mousdown is intercepted.
 *
 * ## Action
 * The actions for each normalized events are there to show what happened in the editabe in the DOM.
 *
 * | actions         | In keyboard event | In pointer event |
 * |-----------------|-------------------|------------------|
 * | insertFiles     |                   |                  |
 * | insertText      |                   |                  |
 * | insertParagraph |                   |                  |
 * | insertHtml      |                   |                  |
 * | historyUndo     |                   |                  |
 * | applyFormat     |                   |                  |
 * | selectAll       |                   |                  |
 * | setRange        |                   |                  |
 * | deleteContent   |                   |                  |
 * | deleteWord      |                   |                  |
 * | deleteHardLine  |                   |                  |
 *
 * For example
 * - historyBack
 * - <todo: to complete>
 *
 *
 * ### handeling javascript events
 * A javascript event is never prevented and always alter the editable in the DOM.
 *
 * The reason that we do not prevent default is because we need more informations. The information
 * modified in the dom. (e.g. observing mutations)
 *
 * There is an exception for the event 'paste' and 'drop'.
 *
 * The reason to preventDefault 'paste' is because most of the time, browsers paste content that
 * need to be cleaned. For that reason we block it from being inserted in the editable element but
 * the informations can be found in the triggered normalized events actions.
 *
 * The reason to preventDefault 'drop' is because some browsers change page when dropping an image
 * or an url that comes from the address bar (e.g. chrome).
 *
 * Description of all javascript event that we handle and theirs tricky part:
 * <todo: to complete>
 *
 * The javascript event of a stack is always in the following order:
 *
 *
 * ### handeling mutations
 *
 * <explain why we need the mutations>
 * - mutation
 *   - whith the mutation events, the browser insert, remove and update nodes
 *     inconsistently and in a buggy way.
 *
 * ## Supported browser & keyboard
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
 *   - Chrome
 *   - Firefox
 *
 * Here is an exhaustive list of the special cases of the browser:
 * - Mac
 *   - Safari
 *     - We need two tick to get information because <ask christophe>
 *
 * ## to classify:
 * ### composition events
 * The events composition (for instance: googlekeyboard) are triggered for any event (like when
 * the user click from one word to another). Theses events are considered useless and therfore
 * we do not trigger when they happen.
 *
 * ### format of the events
 * When there is a "composition" event and a "keyboard" event that is found at the same time, trigger
 * two events ("composition" and "keyboard").
 */
// todo chm: drag/drop between two editor in the same page.
// todo nby: think about when user hit a modifier key trigger event. What should be
//           triggered? all the modifier keys? (e.g. ctrl+alt+anything)
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
     * Map is used to gather informations when multiples keys are found in the same stack.
     */
    _multiKeyMap: {
        keydown?: KeyboardEvent;
        keypress?: KeyboardEvent;
        input?: InputEvent;
    }[] = [];
    /**
     * Map used to collect information about the last events that happened in one tick (or two tick
     * in the case of safari where we need information).
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
    _lastEventType: string;
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
     * TODO: ask CHM
     * Set to true when `_onSelectionChange`. If set, don't process `_onContextMenu`.
     */
    _rangeHasChanged: boolean;
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
     * ? what happen if we don't do it? I erased the `clearTimeout`  from the tests and it works.
     */
    _clickTimeout: NodeJS.Timeout;

    constructor(editable: HTMLElement, callback: TriggerEventBatchCallback) {
        this.editable = editable;
        // todo: to remove, for debugging only
        // this._triggerEvent = (...args): void => {
        //     args[0].events.forEach(event => {
        //         allInputTypes.add((event as any).inputType);
        //         event.actions.forEach(action => {
        //             allActions.add(action.type);
        //         });
        //     });
        //     console.log('args[0].events:', args[0].events);
        //     console.log('allActions:', allActions);
        //     console.log('allInputTypes:', allInputTypes);

        //     callback(...args);
        // };
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
     *
     * After a tick (setTimeout 0ms) the '_processEvents' method is called. All
     * events that happened during the tick are read from the queue and the
     * analysis tries to extract the actions desired by the user such as insert,
     * delete, backspace, spell checking, special characters, etc.
     *
     * Used in:
     * - _onKeyDownOrKeyPress: called a javascript native `Event` of type 'keydown' or 'keypress'
     * - _onDrop: called with a `DataTransferDetails`
     * - _onClipboard: called with a `DataTransferDetails`
     * - _onSelectionChange: called with a `DataTransferDetails`
     *
     *  Directly called for the following javascript native `Event`:
     *  - compositionstart
     *  - compositionupdate
     *  - compositionend
     *  - beforeinput
     *  - input
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

        let eventType = ev.type;
        if (ev.type.startsWith('composition')) {
            // We only need the last composition of the registred events. So 'compositionstart',
            // 'compositionupdate' and 'compositionend' override the key 'composition'.
            eventType = 'composition';
        }

        // It is possible to have multiples keys that must trigger multiples times that are
        // being push in the same tick.
        // To be able to handle this case in `_processEvents`, we aggregate the informations in
        // `_keydownMap`.
        if (['keydown', 'keypress', 'input'].includes(ev.type)) {
            // In the multiples key case, a 'keydown' is always the first event triggered between
            // the three (keydown, keypress, input).
            // So we create a new map each time a 'keydown' is registred.
            if (ev.type === 'keydown') {
                this._multiKeyMap.push({});
            }
            const lastKeydownMap = this._multiKeyMap[this._multiKeyMap.length - 1];
            if (lastKeydownMap) {
                lastKeydownMap[ev.type] = ev;
            }
        }

        this._eventsMap[ev.type] = ev;
        if (ev.type.startsWith('composition')) {
            // Most of the time only need the last composition of the registred events
            this._eventsMap.lastComposition = ev as CompositionEvent;
        }
        this._events.push(ev);
    }
    /**
     * Process the events registered with `_regiterEvent` and call `_triggerBatchEvent`
     * with one or more `NormalizedEvent` when sufficient information has been gathered from all
     * registred events.
     *
     * It could take up to two tick in the browser to gather all the sufficient information.
     * For instance, Safari: <todo: link to safari case>.
     *
     * The strategy to process the events:
     * <to compleet>
     *
     * Sometimes it is impossible to get the data from composision, so we need to get it from
     * an analisis of the mutation.
     * <todo: specify thoses cases>
     *
     * @private
     */
    _processEvents(): void {
        // In some cases, for example cutting with Cmd+X on Safari, the browser
        // triggers events in two different stacks. In such cases, observing
        // events occuring during one tick is not enough so we need to delay the
        // analysis after we observe events during two ticks instead.
        const needSecondTickObservation = this._events.every(ev => {
            // todo: Check simple insert tests fails when removing this condition. It should only
            //       exist because of safari or keyboard devices
            //
            //       In the tests, a nextTick is trigger right after the keydown while in
            //       reality, there is no tick that seems to separate them.
            //       Ask CHM why did he make a nextTick afer the first keydown in the test
            //       'insert char (chrome)' and other similar tests
            return !MultiStackEventTypes.includes(ev.type);
        });
        if (needSecondTickObservation && !this._secondTickObservation) {
            this._secondTickObservation = true;
            setTimeout(this._processEvents.bind(this));
            return;
        }

        let keyboardNormalizedEvent: NormalizedKeyboardEvent;
        let pointerNormalizedEvent: NormalizedPointerEvent;
        let keyboardNormalizedEvents: NormalizedKeyboardEvent[];

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

        // todo: check if I can know that this is a google keyboardBackspace with the inputType
        const isGoogleKeyboardBackspace =
            // false &&
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
        // todo: check if we keep this logic
        // in the test "accent (mac safari)", an erroneous code is triggered (BracketLeft).
        // to prevent the code from being set, we check if a key is dead.
        const isDeadKey = keydownEvent && keydownEvent.key === 'Dead';
        const code =
            !isDeadKey &&
            ((keydownEvent && keydownEvent.code) || (keypressEvent && keypressEvent.code));
        //       (e. g. "^", "`").
        // test: accent (mac safari)
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
            // todo: check if we really need to set the inputType when making a "special accent" in mac
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

        // In case of accent inserted from a Mac, check the char before was one of the special
        // accent temporarily inserted in the DOM (e.g. '^', '`', ...).
        // todo: Check the following heuristic that check this case could be erroneous in some case.
        //       In order to be more specific, we might need to specify exacly thoses accents
        //       ('^', '`', ...) rather than letting go anything that comes from only one char.
        //       Which would reducte the margin of errors (but might not get them all).
        const macAccent =
            compositionData &&
            compositionData.compositionFrom.length === 1 &&
            compositionData.compositionTo.length === 1;
        // compositionData.compositionFrom !== compositionData.compositionTo;
        const macAccentOneChar =
            compositionData &&
            compositionData.compositionFrom === '' &&
            compositionData.compositionTo.length === 1;
        const isCompositionKeyboard = macAccentOneChar || macAccent;

        // todo: to analyze carefully. It is odd to handle virtualkeyboards like that.
        // key === ' ' is because Google keyboard, when writing a space, does not provide other
        // way to understand if a space is typed
        // const googleKeyboardSpace =
        //     key && key === ' ' && this._events.filter(event => event.type === 'input').length === 1;
        // const virtualKeyboard =
        //     (compositionEvent && (key && key.length !== 1)) || googleKeyboardSpace;

        const isVirtualKeyboard =
            (compositionEvent && (key && key.length !== 1)) ||
            isGoogleKeyboardBackspace ||
            !!googleKeyboardKey ||
            !!swiftKeyInsertKey;
        console.log('compositionData:', compositionData);
        console.log('googleKeyboardBackspace:', isGoogleKeyboardBackspace);

        // Compute the set of mutated elements accross all observed events.
        // todo: review this
        const mutatedElements = this._mutationNormalizer.getMutatedElements();

        // When the browser trigger multiples keydown at once, for each keydown there is always
        // also a keypress and an input that must be present.
        const possibleMultiKeydown = this._multiKeyMap.every(
            keydownMap => keydownMap.keydown && keydownMap.keypress && keydownMap.input,
        );
        if (this._multiKeyMap.length > 1 && possibleMultiKeydown) {
            keyboardNormalizedEvents = this._multiKeyMap.map(keydownMap => {
                const keyboardNormalizedEvent: NormalizedKeyboardEvent = {
                    type: 'keyboard',
                    key: keydownMap.keydown.key,
                    code: keydownMap.keydown.code,
                    ctrlKey: keydownMap.keydown.ctrlKey,
                    metaKey: keydownMap.keydown.metaKey,
                    shiftKey: keydownMap.keydown.shiftKey,
                    altKey: keydownMap.keydown.altKey,
                    actions: [],
                    defaultPrevented:
                        keydownMap.keydown.defaultPrevented ||
                        keydownMap.keypress.defaultPrevented ||
                        keydownMap.input.defaultPrevented,
                    inputType: keydownMap.input.inputType,
                };
                const keyboardAction = this._getKeyboardAction(
                    keydownMap.keydown.key,
                    keydownMap.input.inputType,
                    !!mutatedElements.size,
                    true,
                );
                if (keyboardAction) {
                    keyboardNormalizedEvent.actions.push(keyboardAction);
                }
                // todo: should we consider the specialEvents?
                return keyboardNormalizedEvent;
            });
        } else if ((!compositionEvent && key) || isCompositionKeyboard || isVirtualKeyboard) {
            keyboardNormalizedEvent = {
                type: 'keyboard',
                key: key,
                code: code || '',
                ctrlKey: keydownEvent && keydownEvent.ctrlKey,
                metaKey: keydownEvent && keydownEvent.metaKey,
                shiftKey: keydownEvent && keydownEvent.shiftKey,
                altKey: keydownEvent && keydownEvent.altKey,
                actions: [],
                defaultPrevented: !!defaultPrevented,
            };
            if (inputType) {
                keyboardNormalizedEvent.inputType = inputType;
            }
            if (caretPosition) {
                keyboardNormalizedEvent.caretPosition = caretPosition;
            }

            if (customSelectAllEvent) {
                keyboardNormalizedEvent.actions.push(this._getSelectAll());
            }

            const changeFromComposition =
                keyboardNormalizedEvent.compositionFrom && keyboardNormalizedEvent.compositionTo;

            console.log('changeFromComposition:', changeFromComposition);
            if (!changeFromComposition) {
                const keyboardAction = this._getKeyboardAction(
                    key,
                    inputType,
                    !!mutatedElements.size,
                );
                if (keyboardAction) {
                    keyboardNormalizedEvent.actions.push(keyboardAction);
                }
            }

            if (macAccent) {
                keyboardNormalizedEvent.actions = compositionData.actions;
            }
            // todo: refactor caretPosition is only used in "special event". Change this.
        } else if (caretPosition || compositionData) {
            pointerNormalizedEvent = {
                type: 'pointer',
                actions: [],
                defaultPrevented: defaultPrevented,
            };
            // ? should we provide the inputType all the time when we know it?
            //   It is sometimes wrong in case of aggregating two "input" events from of a
            //   virtualKeyboard with a space added as the second "input" event.
            // if (inputType) {
            //     pointerNormalizedEvent.inputType = inputType;
            // }
            if (caretPosition) {
                // todo: discuss with DMO: isn't it strange to only handle inputType for specialEvent?
                pointerNormalizedEvent.inputType = inputType;
                pointerNormalizedEvent.caretPosition = caretPosition;
                // pointerNormalizedEvent.actions.push(...specialEvent.actions);
            }

            if (compositionData) {
                // todo: discuss with DMO: should we add an inputType like insertCompositionText?
                pointerNormalizedEvent.compositionFrom = compositionData.compositionFrom;
                pointerNormalizedEvent.compositionTo = compositionData.compositionTo;
                pointerNormalizedEvent.actions.push(...compositionData.actions);
            }
        }
        const pointerOrKeyboardEvent = pointerNormalizedEvent || keyboardNormalizedEvent;
        if (pointerOrKeyboardEvent) {
            if (cutEvent) {
                const deleteContentAction: DeleteContentAction = {
                    type: 'deleteContent',
                    direction: Direction.FORWARD,
                };
                pointerOrKeyboardEvent.actions = [deleteContentAction];
            } else if (dropEvent) {
                pointerOrKeyboardEvent.actions.push(...this._getDropActions(dropEvent));
            } else if (pasteEvent) {
                pointerOrKeyboardEvent.actions.push(this._getDataTransferAction(pasteEvent));
            } else if (inputEvent && inputEvent.inputType.indexOf('format') === 0) {
                const formatName = inputEvent.inputType.replace('format', '').toLowerCase();

                const applyFormatAction: ApplyFormatAction = {
                    type: 'applyFormat',
                    format: formatName,
                    data: inputEvent.data,
                };

                pointerOrKeyboardEvent.actions.push(applyFormatAction);
            } else if (
                inputEvent &&
                ['historyUndo', 'historyRedo'].includes(inputEvent.inputType)
            ) {
                const historyAction: HistoryAction = {
                    type: inputEvent.inputType as 'historyUndo' | 'historyRedo',
                };
                pointerOrKeyboardEvent.actions.push(historyAction);
            }
        }

        //
        // 2) Create NormalizedEvent from the CompiledEvent
        //

        // Create the custom events corresponding to the compiled data from
        // observed events.
        const normalizedEvents: NormalizedEvent[] = [];
        if (keyboardNormalizedEvent) {
            normalizedEvents.push(keyboardNormalizedEvent);
        } else if (pointerNormalizedEvent) {
            normalizedEvents.push(pointerNormalizedEvent);
        }

        // We did not stopped if `needSecondTickObservation` is true because we need mutations
        // informations between two ticks.
        // Now, we do not need the mutation anymore as the events have been normalized.
        this._mutationNormalizer.stop();

        debugger;
        console.log('this._events:', this._events);
        this._events = null;

        // Select all on safari does not provide all the informations the first stack so wait for
        // the second one.
        if (
            keyboardNormalizedEvent &&
            !keyboardNormalizedEvent.actions.length &&
            keyboardNormalizedEvent.type === 'keyboard' &&
            keyboardNormalizedEvent.key === 'a' &&
            keyboardNormalizedEvent.metaKey
        ) {
            return;
        }

        if (keyboardNormalizedEvents) {
            console.log('keyboardNormalizedEvents:', keyboardNormalizedEvents);
            this._triggerEventBatch({ events: keyboardNormalizedEvents, mutatedElements });
        } else if (normalizedEvents.length || mutatedElements.size) {
            console.log('normalizedEvents:', normalizedEvents);
            this._triggerEventBatch({ events: normalizedEvents, mutatedElements });
        }
        this._secondTickObservation = false;
        this._eventsMap = {};
        this._lastEventType = null;
        this._multiKeyMap = [];
    }
    _getCompositionData(
        compositionEvent: CompositionEvent,
        inputEvent: InputEvent,
    ): CompositionData | undefined {
        if (compositionEvent && inputEvent) {
            let compositionDataString: string = compositionEvent.data;

            // Specific case for SwiftKey. Swiftkey add a space in the inputEvent but not in
            // the composition event.
            // test: add space with auto-correction (SwiftKey)
            const isSwiftKeyAutocorrect =
                inputEvent.inputType === 'insertText' &&
                inputEvent.data &&
                inputEvent.data.length === 1 &&
                inputEvent.data !== compositionDataString &&
                inputEvent.data === ' ';
            if (isSwiftKeyAutocorrect) {
                compositionDataString += ' ';
            }

            return inputEvent && this._getComposition(compositionDataString);
        } else {
            // safari trigger an input with 'insertReplacementText' when it correct a word.
            // We want to get the composition with this._getComposition(data);
            // edge send an input with insertText
            const isSafariCorrection =
                inputEvent && inputEvent.inputType === 'insertReplacementText';
            // todo: to remove when edge will not be covered anymore
            const isEdgeCorrection = inputEvent && inputEvent.inputType === '';

            if (isSafariCorrection || isEdgeCorrection) {
                return this._getComposition(inputEvent.data);
            }
        }
    }

    /**
     * If there is an event of type 'cut', 'dorp', 'paste' or 'input' within the `this._eventsMap`,
     * Process them to use them to complement a NormalizedEvent.
     */
    // _getSpecialEventDetails(): SpecialEventDetails | undefined {
    // const cutEvent = this._eventsMap.cut;
    // const dropEvent = this._eventsMap.drop;
    // const pasteEvent = this._eventsMap.paste;
    // const inputEvent = this._eventsMap.input;
    // if (cutEvent) {
    //     const deleteContentAction: DeleteContentAction = {
    //         type: 'deleteContent',
    //         direction: Direction.FORWARD,
    //     };
    //     return {
    //         // ? only few place (cut, drop) where we need target. can we place the key somewhere else
    //         caretPosition: cutEvent.caretPosition,
    //         actions: [this._makeAction(deleteContentAction)],
    //         // todo: check if it's correct
    //         defaultPrevented: false,
    //     };
    // } else if (dropEvent) {
    //     return {
    //         caretPosition: dropEvent.caretPosition,
    //         actions: this._getDropActions(dropEvent),
    //         // we always preventDefault for dropEvent
    //         defaultPrevented: true,
    //     };
    // } else if (pasteEvent) {
    //     return {
    //         //? why there is no paste event here and the cut and drop are handeled in the top?
    //         // ? why the caretPosition is sometimes got from 'detail.caretPosition' and sometimes 'target'?
    //         caretPosition: pasteEvent.caretPosition,
    //         actions: [this._getDataTransferAction(pasteEvent)],
    //         defaultPrevented: true,
    //     };
    // } else if (inputEvent && inputTypeCommands.has(inputEvent.inputType)) {
    //     let inputCommandAction;
    //     if (inputEvent.inputType.indexOf('format') === 0) {
    //         const formatName = inputEvent.inputType.replace('format', '').toLowerCase();
    //         const applyFormatAction: ApplyFormatAction = {
    //             type: 'applyFormat',
    //             format: formatName,
    //             data: inputEvent.data,
    //         };
    //         inputCommandAction = [this._makeAction(applyFormatAction)];
    //     } else {
    //         // ? Why do we let thoses kind of actions go through the system?
    //         //   Shouldn't it be events instead?
    //         // todo: review with DMO
    //         inputCommandAction = [this._makeAction(inputEvent.inputType, {})];
    //     }
    //     return {
    //         // As the keyboard events as already been processed, we can be sure that is
    //         // a pointer event.
    //         caretPosition: this._initialCaretPosition,
    //         actions: inputCommandAction,
    //         // todo: check if it's correct
    //         defaultPrevented: false,
    //     };
    // }
    // }

    // todo: discuss with DMO, do we still try to infer the key from input?
    _inferKeyFromInput(inputEvent: any): string {
        // Case for virtual keyboard: Some virtual keyboards does not trigger keydown when a key
        // is pushed but send an input instead.
        // In that case, infer the key that has been pushed from the inputEvent.inputType.
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
     * Get a keyboard action if something has happned in the DOM (insert, delete, navigation).
     *
     * @param normalizedEvent
     * @param hasMutatedElements
     * @param isMultiKey
     */
    _getKeyboardAction(
        key: string,
        inputType: string,
        hasMutatedElements: boolean,
        isMultiKey = false,
    ):
        | InsertTextAction
        | InsertParagraphAction
        | InsertTextAction
        | SetRangeAction
        | DeleteWordAction
        | DeleteHardLineAction
        | DeleteContentAction {
        const isInsertOrRemoveAction = hasMutatedElements && !inputTypeCommands.has(inputType);
        if (isInsertOrRemoveAction) {
            // Keys ctrl+x (or another potential user mapping) can trigger an inputType 'deleteByCut'
            if (key === 'Backspace' || key === 'Delete' || inputType === 'deleteByCut') {
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
                    const insertParagraphAction: InsertParagraphAction = {
                        type: 'insertParagraph',
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
            const setRangeAction: SetRangeAction = {
                type: 'setRange',
                // Set the range according to the current one. Set the origin key
                // in order to track the source of the move.
                domRange: this._getRange(),
            };
            return setRangeAction;
        }
    }
    _getDropActions(ev: DataTransferDetails): (DeleteContentAction | SetRangeAction)[] {
        const actions = [];
        if (ev.draggingFromEditable && !ev.files.length) {
            const deleteContentAction: DeleteContentAction = {
                type: 'deleteContent',
                direction: Direction.FORWARD,
            };
            actions.push(deleteContentAction);
        }
        const setRangeAction: SetRangeAction = {
            type: 'setRange',
            domRange: ev.range,
        };
        actions.push(setRangeAction);
        actions.push(this._getDataTransferAction(ev));
        return actions;
    }
    /**
     * extract from dataTranser informations to know what has been done in the DOM and return
     * it a normalizedAction.
     *
     * when drag and dropping, most browsers wrap the element with tags and styles.
     * And when dropping in the (same or different) browser, there is many differents
     * behavior.
     *
     * Some browser reload the page when dropping (img or link (from status bar)).
     * For this reason, we block all the content from being added in the editable. (otherwise reloading happen).
     *
     */
    _getDataTransferAction(
        dataTransfer: DataTransferDetails,
    ): InsertFilesAction | InsertHtmlAction | InsertTextAction {
        // c'est traiter a un autre endtroit
        // typically, when you drap drop in the image

        // the insertFile
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

        // from the browser, the URI list comes from an "imgage" or a "link"

        // the user can drag and drop a link or an img, from the browser nav bar
        if (html) {
            if (uri) {
                const temp = document.createElement('temp');
                temp.innerHTML = html;
                const element = temp.querySelector('a, img');
                // ? why there would be no element?
                if (element) {
                    // ? why !dataTransfer.draggingFromEditable
                    // ? why the innerHTML would be empty?
                    if (
                        !dataTransfer.draggingFromEditable &&
                        element.nodeName === 'A' &&
                        element.innerHTML === ''
                    ) {
                        // add default content if external link
                        element.innerHTML = uri;
                    }
                    const insertHtmlAction: InsertHtmlAction = {
                        type: 'insertHtml',
                        html: element.outerHTML,
                        text: uri,
                    };
                    return insertHtmlAction;
                }
                const insertHtmlAction: InsertHtmlAction = {
                    type: 'insertHtml',
                    html: html,
                    text: uri,
                };
                return insertHtmlAction;
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
     * that was inserted and trigger the corresponding events on the listener.
     *
     * Special case impossible to deal with:
     * In the case of we don't have the event data and mutation and we have a sentence like (rather than a word)
     * "a b" that has been change with a composition with "a c". we will receive the word change
     * "b" to "c" instead of "a b" to "a c".
     * This case exists but has not been found.
     *
     * @private
     */
    _getComposition(compositionData: string): CompositionData {
        // With the google keyboard, if they were a composition start somewhere and nothing
        // was updated from the user, when the composition changes, it trigger a compositionend
        // even if no change have been made. In such a case we filter out these events.

        // if (!eventData.inputType) {
        //     return [];
        // }

        // move that logic
        const charMap = this._mutationNormalizer.getCharactersMapping();

        let index = charMap.index;
        let insert = charMap.insert;
        let remove = charMap.remove;

        // we didn't found what was the intention or the action because it look the same
        // most of the time (if not in all case) insert and remove will be both empty,
        // other times, ev.data is always prioritary
        if (insert === remove && compositionData) {
            insert = compositionData;
            remove = compositionData;
        }

        // In mutation:
        // - we get the changes
        // - try to extract the word or a part of he word (with or without position)
        // - locate: where the change has been made

        const range = this._getRange();
        // if index === -1 it means we could not find the position in the mutated elements
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
            // to find the index of the proper character.
            insertEnd += range.endOffset;
            index = insertEnd - insert.length;
        } else {
            // it's the index not yet finished
            let offset = index + insert.length - 1;
            if (
                charMap.current.nodes[offset] &&
                (range.endContainer !== charMap.current.nodes[offset] ||
                    range.endOffset !== charMap.current.offsets[offset] + 1)
            ) {
                offset++;
                while (
                    charMap.current.nodes[offset] &&
                    (range.endContainer !== charMap.current.nodes[offset] ||
                        range.endOffset > charMap.current.offsets[offset])
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
            // when a virtual keyboard (at least swiftKey) add a space at the end of each composition
            // in that case the insert will be ' '. So we filter out these events
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

        // in the case the virtual keyboard add space, we want to remove it from the removed
        // only if we had an end space before
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
        const setRangeAction: SetRangeAction = {
            type: 'setRange',
            domRange: {
                startContainer: previousNodes[index] || lastPreviousNode,
                startOffset: index in previousOffsets ? previousOffsets[index] : lastPreviousOffset,
                endContainer: previousNodes[offsetEnd] || lastPreviousNode,
                endOffset:
                    offsetEnd in previousOffsets ? previousOffsets[offsetEnd] : lastPreviousOffset,
                direction: Direction.BACKWARD,
            },
        };
        const insertTextAction: InsertTextAction = {
            type: 'insertText',
            text: rawInsert,
        };
        const actions = [setRangeAction, insertTextAction];

        if (hasEndSpace) {
            if (hadEndSpace) {
                index += rawRemove.length;

                const setRangeAction: SetRangeAction = {
                    type: 'setRange',
                    domRange: {
                        startContainer: previousNodes[index],
                        startOffset: previousOffsets[index],
                        endContainer: previousNodes[offsetEnd],
                        endOffset: previousOffsets[index + 1],
                        direction: Direction.BACKWARD,
                    },
                };
                actions.push(setRangeAction);
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
     * Process the given compiled event as a backspace/delete to identify the text
     * that was removed and return an array of the correspotind NormalizedAction.
     *
     * In the case we cut, the direction will be `Direction.FORWARD`.
     *
     * @private
     */
    // todo: change the signature?
    _getRemoveAction(
        key: string,
        inputType: string,
        isMultiKey: boolean,
    ): DeleteWordAction | DeleteHardLineAction | DeleteContentAction {
        // ? why do we set the direction instead of just letting the event continue and being
        // the same name as the input events API?

        const direction = key === 'Backspace' ? Direction.BACKWARD : Direction.FORWARD;
        // ? ask chm
        // a word a been deleted. So we need to know which one it is.
        // we need to retrieve what the person has deleted.
        const characterMapping = this._mutationNormalizer.getCharactersMapping();
        // todo: change insert with insertText and remove with removeText
        // todo: check if we can remove this condition or get rid of `isMultiKey`
        if (!isMultiKey && characterMapping.insert === characterMapping.remove) {
            return;
        }
        // firefox does not provide inputType so we deduce it fom the modifier keys
        // todo: discuss with DMO: do we really want to deduce it?
        // todo: to check if a wrong deduction could been made (from a composition event for instance)
        const keydownEvent = this._eventsMap.keydown;
        const deleteWordWithoutInputType =
            !inputType &&
            keydownEvent.ctrlKey &&
            !keydownEvent.altKey &&
            !keydownEvent.shiftKey &&
            !keydownEvent.metaKey;
        const deleteHardLineWithoutInputType =
            !inputType &&
            (keydownEvent.ctrlKey &&
                !keydownEvent.altKey &&
                keydownEvent.shiftKey &&
                !keydownEvent.metaKey);
        // todo: should we transform inputType from 'deleteContentBackward' or
        //       'deleteContentForward' to 'deleteWordBackward' or 'deleteWordForward' ?
        const isSwiftKeyDeleteWord =
            (inputType === 'deleteContentForward' || inputType === 'deleteContentBackward') &&
            characterMapping.remove.length > 1;

        if (
            inputType === 'deleteWordForward' ||
            inputType === 'deleteWordBackward' ||
            isSwiftKeyDeleteWord ||
            // Case of firefox without inputType
            deleteWordWithoutInputType
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
            inputType === 'deleteSoftLineBackward' ||
            deleteHardLineWithoutInputType
        ) {
            // todo: come to see me later
            const deleteHardLineAction: DeleteHardLineAction = {
                type: 'deleteHardLine',
                direction: direction,
                domRange: {
                    startContainer: characterMapping.previous.nodes[characterMapping.index],
                    startOffset: characterMapping.previous.offsets[characterMapping.index],
                    endContainer:
                        characterMapping.previous.nodes[
                            characterMapping.index + characterMapping.remove.length - 1
                        ],
                    endOffset:
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
            domRange: this._getRange(),
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
        let leftToRight: boolean;
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
                leftToRight = selection.anchorOffset <= selection.focusOffset;
            } else {
                leftToRight = selection.anchorNode === nativeRange.startContainer;
            }
            range = {
                startContainer: nativeRange.startContainer,
                startOffset: nativeRange.startOffset,
                endContainer: nativeRange.endContainer,
                endOffset: nativeRange.endOffset,
                direction: leftToRight ? Direction.FORWARD : Direction.BACKWARD,
            };
        }

        // If an event is given, then the range must be at least partially
        // contained in the target of the event, otherwise it means it took no
        // part in it. In this case, consider the caret position instead.
        // This can happen when target is an input or a contenteditable=false.
        // ? why do we need a caret position instead in that case?
        // why not selecting the whole element?
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
     * Return true if the given range is selecting the whole editable.
     *
     * @param range
     */
    // ? is this really usefull to detect if the range has been fully selected.
    // ? why do we need it?
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

        // TODO: browser range don't set `startContainer` and `endContainer` to lowest possible depth
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
     * ? Why do we need this function?
     *
     * ? Where do we need this function?
     * _isSelectAll
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
        // ? what is cross visible?
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
        // ?why I cannot return false?
        //return false;
    }
    /**
     * Determine if a node is considered visible (see visible elements)[](todo: link).
     */
    _isVisible(el: Node): boolean {
        if (el === this.editable) {
            // The editable node was reached without encountering a hidden
            // container. The editable node is supposed to be visible.
            // ? why is it supposed to be visible? What kind of visible (if display: none)
            return true;
        }
        // A <br> element with no next sibling is never visible.
        if (el.nodeName === 'BR' && !el.nextSibling) {
            return false;
        }
        const element = el.nodeType === Node.TEXT_NODE ? el.parentElement : el;
        // todo: check getComputedStyle perfs. This could be expensive and create a "Layout Thrashing"
        const style = window.getComputedStyle(element as Element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        return this._isVisible(el.parentNode);
    }
    /**
     * Why do we need this function?
     *
     * nby supposition:
     * Get the carret position for a MouseEvent or a touchEvent
     * If the offsetNode is not in the editable, <ask chm>
     *
     * Used in:
     * _getRange
     * _onContextMenu
     * _onPointerDown
     * _onClick
     * _onDrop
     */
    _locateEvent(ev: MouseEvent | TouchEvent): CaretPosition {
        console.log('ev:', ev);
        const x = ev instanceof MouseEvent ? ev.clientX : ev.touches[0].clientX;
        const y = ev instanceof MouseEvent ? ev.clientY : ev.touches[0].clientY;
        let caretPosition = caretPositionFromPoint(x, y);
        // ?
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
        // clearTimeout(this._clickTimeout); // ?
        this._clickTimeout = setTimeout(() => {
            // ? How is calculated rangeHasChanged?
            // ? Why should we return if the _currentlySelectingAll?
            if (!this._rangeHasChanged || this._currentlySelectingAll) {
                return;
            }
            this._initialCaretPosition = this._locateEvent(ev);
            const setRangeAction: SetRangeAction = {
                type: 'setRange',
                domRange: this._getRange(ev),
            };
            // why the _onContextMenu trigger an event, shouldn't it be on the _processEvents?
            this._triggerEventBatch({
                events: [
                    {
                        type: 'pointer',
                        caretPosition: this._initialCaretPosition,
                        defaultPrevented: ev.defaultPrevented,
                        actions: [setRangeAction],
                    },
                ],
                mutatedElements: new Set([]),
            });
            this._rangeHasChanged = false;
        }, 0);
        // The _clickedInEditable property is used to assess whether the user
        // is currently changing the selection by using the mouse. If the
        // context menu ends up opening, the user is definitely not selecting.
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
        const range = this._getRange();
        const [offsetNode, offset] = targetDeepest(range.startContainer, range.startOffset);
        this._initialCaretPosition = { offsetNode, offset };
    }
    /**
     * Set internal properties of the pointer down event to retrieve them later
     * on when the user stops dragging its selection and the range has changed.
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
            this._rangeHasChanged = false;
            // Mark the future event stack as following a single pointer action.
            this._lastEventType = ev.type;
            this._eventsMap[ev.type] = ev;
        }
    }
    /**
     * Catch setRange actions coming from clicks.
     *
     * @param ev
     */
    _onClick(ev: MouseEvent): void {
        // Mark the future event stack as following a single pointer action.
        this._lastEventType = ev.type;
        this._eventsMap[ev.type] = ev;

        // Don't trigger events on the editable if the click was done outside of
        // the editable itself or on something else than an element.
        if (!(this._clickedInEditable && ev.target instanceof Element)) return;

        // When the users clicks in the DOM, the range is set in the next tick.
        // The observation of the resulting range must thus be delayed to the
        // next tick as well. Store the data we have now before it gets invalid.
        this._initialCaretPosition = this._locateEvent(ev);
        // clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => this._analyzeRangeChange(ev), 0);
    }
    /**
     * Analyze a change of range to trigger a pointer event for it.
     *
     * @param ev
     */
    _analyzeRangeChange(ev: MouseEvent): void {
        if (!this._rangeHasChanged) return;

        const range = this._getRange(ev);
        const setRangeAction: SetRangeAction = {
            type: 'setRange',
            domRange: range,
        };
        // why the _analyzeRangeChange trigger an event, shouldn't it be on the _processEvents?
        this._triggerEventBatch({
            events: [
                {
                    type: 'pointer',
                    caretPosition: this._initialCaretPosition,
                    defaultPrevented: ev.defaultPrevented,
                    actions: [setRangeAction],
                },
            ],
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
     * some browser add style on the image, the span inconsistently on the drop or paste
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
            range: {
                startContainer: caretPosition.offsetNode,
                startOffset: caretPosition.offset,
                endContainer: caretPosition.offsetNode,
                endOffset: caretPosition.offset,
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
            type: ev.type,
            'text/plain': clipboard.getData('text/plain'),
            'text/html': clipboard.getData('text/html'),
            'text/uri-list': clipboard.getData('text/uri-list'),
            files: [],
            originalEvent: ev,
            range: this._getRange(),
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

        this._rangeHasChanged = true;
        // There are only a few cases where a selection change might actually be
        // a select all. Outside of these cases, there is no need to make the
        // costly check.
        // 1. Following a modified key being pressed. (e.g. Ctrl+A)
        const modifiedKeyEvent =
            this._eventsMap.keydown &&
            (this._eventsMap.keydown.ctrlKey || this._eventsMap.keydown.metaKey);
        // 2. Following a single pointer action. (e.g. right click > Select All)
        const followsPointerAction =
            this._lastEventType && pointerEventTypes.includes(this._lastEventType);

        // This heuristic protects against a costly `_isSelectAll` call.
        const heuristic = modifiedKeyEvent || followsPointerAction;
        const isSelectAll = heuristic && this._isSelectAll(this._getRange());

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
                    domRange: this._getRange(),
                };
                // In this case, the select all was triggered from the pointer.
                const normalizedPointerEvent: NormalizedPointerEvent = {
                    type: 'pointer',
                    caretPosition: this._initialCaretPosition,
                    defaultPrevented: false,
                    actions: [selectAllAction],
                };
                // why the _onSelectionChange trigger an event, shouldn't it be on the _processEvents?

                // We did not find any case where a select all triggered from
                // the mouse actually resulted in a mutation, so the mutation
                // normalizer is not listnening in this case. If it happens to
                // be insufficient later on, the mutated elements will need to
                // be retrieved from the mutation normalizer.
                this._triggerEventBatch({
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
