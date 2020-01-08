/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { Direction } from '../src/VRange';
import { testContentNormalizer } from './testContentNormalizer';
import {
    EventNormalizer,
    EventBatch,
    NormalizedKeyboardEvent,
    NormalizedPointerEvent,
} from '../src/EventNormalizer';

type TriggerNativeEventsOption =
    | MouseEventInit
    | KeyboardEventInit
    | CompositionEventInit
    | InputEventInit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | CustomEventInit<any>
    | EventInit
    | DragEventInit
    | ClipboardEventInit
    | TouchEventInit;

export interface TestKeyboardEvent {
    type: 'keydown' | 'keypress' | 'keyup';
    key: string;
    code: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    defaultPrevented?: boolean;
}
export interface TestCompositionEvent {
    type: 'compositionstart' | 'compositionupdate' | 'compositionend';
    data: string;
}
export interface TestInputEvent {
    type: 'beforeinput' | 'input';
    // firefox does not provide data [or inputType, which is why theses key are optionnal
    data?: string;
    inputType?: string;
    defaultPrevented?: boolean;
}
export interface TestMutationEvent {
    type: 'mutation';
    textContent: string;
    targetParentId: string;
    targetIndex: number;
    removedNodes?: {
        index?: number;
        parentId?: string;
        // todo: remove this key. it was introduced because of backward compatibility.
        id?: string;
    }[];
}
export interface TestSelectionEvent {
    type: 'selection';
    focus: {
        id: string;
        index: number;
        offset: number;
    };
    anchor: {
        id: string;
        index: number;
        offset: number;
    };
}

export type TestEvent =
    | TestKeyboardEvent
    | TestCompositionEvent
    | TestInputEvent
    | TestMutationEvent
    | TestSelectionEvent;

/**
 * Get the event type based on its name.
 *
 * @private
 * @param {string} eventName
 * @returns string
 *  'mouse' | 'keyboard' | 'unknown'
 */
function _eventType(eventName: string): string {
    const types = {
        MouseEvent: ['click', 'mouse', 'pointer', 'contextmenu', 'select', 'wheel'],
        CompositionEvent: ['composition'],
        InputEvent: ['input'],
        KeyboardEvent: ['key'],
        DragEvent: ['dragstart', 'dragend', 'drop'],
        ClipboardEvent: ['beforecut', 'cut', 'paste'],
        TouchEvent: ['touchstart', 'touchend'],
    };
    let type = 'unknown';
    Object.keys(types).forEach(function(key) {
        const isType = types[key].some(function(str) {
            return eventName.toLowerCase().indexOf(str) !== -1;
        });
        if (isType) {
            type = key;
        }
    });
    return type;
}
/**
 * Trigger events natively on the specified target.
 *
 * @param {node} el
 * @param {string} eventName
 * @param {object} [options]
 * @returns {Promise <Event>}
 */
function triggerEvent(el: Node, eventName: string, options: TriggerNativeEventsOption): Event {
    if (!el) {
        console.warn('Try to trigger an event on an undefined node');
        return;
    }
    el = (el as HTMLElement).tagName ? el : el.parentNode;
    if (!el.parentNode) {
        console.warn('Try to trigger an event on a node out of the DOM');
        return;
    }
    options = Object.assign(
        {
            view: window,
            bubbles: true,
            cancelable: true,
        },
        options,
    );
    const type = _eventType(eventName);
    let ev: Event;
    switch (type) {
        case 'MouseEvent':
            ev = new MouseEvent(eventName, options);
            break;
        case 'KeyboardEvent':
            ev = new KeyboardEvent(eventName, options);
            break;
        case 'CompositionEvent':
            ev = new CompositionEvent(eventName, options);
            break;
        case 'DragEvent':
            ev = new DragEvent(eventName, options);
            break;
        case 'ClipboardEvent':
            if (!('clipboardData' in options)) {
                throw new Error('Wrong test');
            }
            ev = new ClipboardEvent(eventName, options);
            break;
        case 'InputEvent':
            ev = new InputEvent(eventName, options);
            break;
        case 'TouchEvent':
            ev = new TouchEvent(eventName, options);
            break;
        default:
            ev = new Event(eventName, options);
            break;
    }
    el.dispatchEvent(ev);
    return ev;
}
function setRange(
    startContainer: Node,
    startOffset: number,
    endContainer: Node,
    endOffset: number,
): void {
    const doc = startContainer.ownerDocument;
    const selection = doc.getSelection();
    if (selection.rangeCount) {
        const domRange: Range = selection.getRangeAt(0);
        domRange.setStart(startContainer, startOffset);
        domRange.collapse(true);
    } else {
        const domRange: Range = doc.createRange();
        domRange.setStart(startContainer, startOffset);
        domRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
    selection.extend(endContainer, endOffset);
}

async function nextTick(): Promise<void> {
    return new Promise((resolve): number => setTimeout(resolve));
}

/**
 *
 * For each `eventStackList` in `triggerEvents()`, we need to retrieve information of the `index`
 * that is contained within a `parent` that has an `id`.
 * It is possible that within the `eventStackList` loop, childs of a node are removed. However,
 * the index of a childNode within his parent is encoded relative to the beggining of the stack
 * when all nodes were still preset.
 *
 * For that reason we cannot retrieve a childNode with `parent.childNodes[index]` but we must do
 * `offsetCacheMap[parentId + '$' + index]`.
 *
 * Encode the key of the offsetCacheMap with "<parentId>$<childIndex>" (e.g. if the parent id is
 * 'a' and the offset is 0, the key will be encoded as "a$0").
 */
let offsetCacheMap: { [key: string]: Node };

/**
 * Add all childNodes of node retursively in `offsetCacheMap`.
 */
function addNodeToOffsetCacheMap(node: Node): void {
    if (node.childNodes)
        node.childNodes.forEach((childNode, index) => {
            offsetCacheMap[(node as HTMLElement).id + '$' + index] = childNode;
            addNodeToOffsetCacheMap(childNode);
        });
}
function resetOffsetCacheMap(editableElement: HTMLElement): void {
    offsetCacheMap = {};
    addNodeToOffsetCacheMap(editableElement);
}
function getNodeFromOffsetCacheMap(parentId: string, index: number): Node {
    return offsetCacheMap[parentId + '$' + index];
}

async function triggerEvents(eventStackList: TestEvent[][]): Promise<void> {
    const editableElement = document.getElementById('editable');
    resetOffsetCacheMap(editableElement);
    eventStackList.forEach(async eventStack => {
        eventStack.forEach(testEvent => {
            if (testEvent.type === 'mutation') {
                const mutationEvent: TestMutationEvent = testEvent;
                // const mutatedElementParent = document.getElementById(mutationEvent.targetParentId);
                // const mutatedNode = mutatedElementParent.childNodes[mutationEvent.targetIndex];
                const mutatedNode = getNodeFromOffsetCacheMap(
                    mutationEvent.targetParentId,
                    mutationEvent.targetIndex,
                );
                if (testEvent.removedNodes) {
                    testEvent.removedNodes
                        .map(removedNodeDescription => {
                            // todo: remove this "if" and keep the "else" when regenerated events
                            //       it was introduced to keep compatible with the `id` key
                            if (removedNodeDescription.id) {
                                return document.getElementById(removedNodeDescription.id);
                            } else {
                                return getNodeFromOffsetCacheMap(
                                    removedNodeDescription.parentId,
                                    removedNodeDescription.index,
                                );
                            }
                        })
                        .forEach(removedNode => {
                            removedNode.parentNode.removeChild(removedNode);
                        });
                } else {
                    mutatedNode.textContent = mutationEvent.textContent;
                }
            } else if (testEvent.type === 'selection') {
                const selectionEvent: TestSelectionEvent = testEvent;
                const focusElement = document.getElementById(selectionEvent.focus.id);
                const anchorElement = document.getElementById(selectionEvent.anchor.id);
                setRange(
                    anchorElement.childNodes[selectionEvent.anchor.index],
                    selectionEvent.anchor.offset,
                    focusElement.childNodes[selectionEvent.focus.index],
                    selectionEvent.focus.offset,
                );
            } else {
                const { type, ...options } = testEvent;
                triggerEvent(editableElement, type, options as TriggerNativeEventsOption);
            }
        });
        await nextTick();
        await nextTick();
    });
    await nextTick();
    return;
}

// ? is all the tests special cases that we handle because the browser are doing something
// that is not conform to a standard or is it just a normal flow that we test?
// We might want to separate the two tests to make the distinction clear.
// maybe we simply add after each title (*special case*)?

describe('utils', () => {
    describe.only('EventNormalizer', () => {
        let container: HTMLElement;
        let root: HTMLElement;
        let other: HTMLElement;
        let eventBatchs = [];
        let normalizer: EventNormalizer;
        function callback(res: EventBatch): void {
            eventBatchs.push(res);
        }
        function callbackBefore(done: Function): void {
            // ? what is the purpose of the container and the root?
            container = document.createElement('container');
            container.style.fontFamily = 'Courier, Courier New';
            container.style.lineHeight = '20px';
            container.style.fontSize = '18px';
            container.style.display = 'block';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            root = document.createElement('div');
            root.id = 'editable';
            root.style.display = 'block';
            container.appendChild(root);
            // ? why do we create other?
            other = document.createElement('div');
            other.innerText = 'abc';
            container.appendChild(other);
            document.body.appendChild(container);
            normalizer = new EventNormalizer(root, callback);
            done();
        }
        function callbackAfter(done: Function): void {
            document.body.removeChild(container);
            normalizer.destroy();
            done();
        }

        before(callbackBefore);
        after(callbackAfter);

        it('Check if your browser have an available font (Courier) to have valid test', async () => {
            root.innerHTML = '<span>i</span>';
            const rect = (root.firstChild as HTMLElement).getBoundingClientRect();
            expect(rect.height).to.equal(20);
            expect(rect.width).to.gt(10.5);
            expect(rect.width).to.lt(11);
        });

        describe('keyboard', () => {
            describe('insert', () => {
                describe('insert char at the end of a word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hell;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 4, text, 4);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: 'o',
                            code: 'KeyO',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'insertText',
                                    text: 'o',
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        // virtual keyboards does not provide code
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });
                    it('should insert char at the end of a word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'o',
                            code: 'KeyO',
                        });
                        await nextTick();
                        triggerEvent(root, 'keypress', {
                            key: 'o',
                            code: 'KeyO',
                        });
                        triggerEvent(root, 'beforeinput', {
                            data: 'o',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello';
                        triggerEvent(root, 'input', {
                            data: 'o',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'o', code: 'KeyO' },
                                { type: 'keypress', key: 'o', code: 'KeyO' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it.skip('should insert char at the end of a word (mac safari)', async () => {
                        root.innerHTML = '';
                        root.innerHTML = "<p id='a'>hell<br/>world</p>";
                        const p = document.getElementById('a');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it.skip('should insert char at the end of a word (mac chrome)', async () => {
                        root.innerHTML = '';
                        root.innerHTML = "<p id='a'>hell<br/>world</p>";
                        const p = document.getElementById('a');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'o', code: 'KeyO' },
                                { type: 'keypress', key: 'o', code: 'KeyO' },
                                { type: 'beforeinput', data: 'o', inputType: 'insertText' },
                                { type: 'input', data: 'o', inputType: 'insertText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it.skip('should insert char at the end of a word (mac firefox)', async () => {
                        root.innerHTML = '';
                        root.innerHTML = "<p id='a'>hell<br/>world</p>";
                        const p = document.getElementById('a');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it.skip('should insert char at the end of a word (GBoard)', async () => {
                        root.innerHTML = '';
                        root.innerHTML = "<p id='a'>hell<br/>world</p>";
                        const p = document.getElementById('a');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([
                            [
                                {
                                    type: 'mutation',
                                    textContent: 'hellworld',
                                    targetParentId: '',
                                    targetIndex: 11,
                                },
                            ],
                            [
                                { type: 'compositionstart', data: '' },
                                { type: 'compositionupdate', data: 'hell' },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: 'hello',
                                    inputType: 'insertCompositionText',
                                },
                                { type: 'compositionupdate', data: 'hello' },
                                {
                                    type: 'input',
                                    data: 'hello',
                                    inputType: 'insertCompositionText',
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (SwiftKey)', async () => {
                        root.innerHTML = '';
                        root.innerHTML = "<p id='a'>hell<br/>world</p>";
                        const p = document.getElementById('a');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                { type: 'beforeinput', data: 'o', inputType: 'insertText' },
                                { type: 'input', data: 'o', inputType: 'insertText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('insert space at the end of a word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hello;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 5, text, 5);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: ' ',
                            code: 'Space',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    text: ' ',
                                    type: 'insertText',
                                },
                            ],
                        };

                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        // virtual keyboards does not provide code
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });
                    it('should insert space at the end of a word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: ' ',
                            code: 'Space',
                        });
                        await nextTick();
                        triggerEvent(root, 'keypress', {
                            key: ' ',
                            code: 'Space',
                        });
                        triggerEvent(root, 'beforeinput', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello ';
                        triggerEvent(root, 'input', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        setRange(text, 6, text, 6);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        // todo: each time there we deep equal, if we set a type for the evaluated
                        // variable, it is easier to rename
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: ' ', code: 'Space' },
                                { type: 'keypress', key: ' ', code: 'Space' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 6 },
                                    anchor: { id: 'a', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keyup', key: ' ', code: 'Space' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (SwiftKey)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(root, 'keydown', {
                            key: 'Unidentified',
                            code: '',
                        });
                        await nextTick();
                        triggerEvent(root, 'beforeinput', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello ';
                        triggerEvent(root, 'input', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        setRange(text, 6, text, 6);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'compositionstart', data: '' },
                                { type: 'compositionupdate', data: 'hello' },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                { type: 'beforeinput', data: ' ', inputType: 'insertText' },
                                { type: 'input', data: ' ', inputType: 'insertText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 6 },
                                    anchor: { id: 'a', index: 0, offset: 6 },
                                },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('insert char with accent at the end of a word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let macAccentKeyboardEvent: NormalizedKeyboardEvent;
                    let macKeystrokeKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hell;
                        p = document.getElementById('a');
                        text = p.childNodes[0];

                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: 'ô',
                            code: 'KeyO',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'insertText',
                                    text: 'ô',
                                },
                            ],
                        };
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                        macAccentKeyboardEvent = {
                            type: 'keyboard',
                            // ? verify if it's the real inputType that whe want
                            inputType: 'insertCompositionText',
                            // ? should we insert compositionFrom and compositionTo?
                            key: '^',
                            // ? verify if it's the proper code ('')
                            code: '',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            // ? is it usefull to put the same key as compositionTo?
                            defaultPrevented: false,
                            actions: [
                                {
                                    text: '^',
                                    type: 'insertText',
                                },
                            ],
                        };
                        macKeystrokeKeyboardEvent = {
                            type: 'keyboard',
                            // todo: check 'ô'. For the same behavior in chrome it's 'o'.
                            key: 'ô',
                            code: 'KeyO',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            inputType: 'insertCompositionText',
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'setRange',
                                    domRange: {
                                        startContainer: text,
                                        startOffset: 4,
                                        endContainer: text,
                                        endOffset: 5,
                                        direction: Direction.BACKWARD,
                                    },
                                },
                                {
                                    text: 'ô',
                                    type: 'insertText',
                                },
                            ],
                        };
                    });
                    it('should insert char with accent at the end of a word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keyup', { key: 'Dead', code: 'BracketLeft' }); // no keydown, no keypress
                        await nextTick();
                        await nextTick();
                        triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                        await nextTick();
                        triggerEvent(root, 'keypress', { key: 'ô', code: 'KeyO' });
                        triggerEvent(root, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hellô';
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (ubuntu firefox)', async () => {
                        triggerEvent(root, 'keydown', {
                            // no keypress
                            key: 'Dead',
                            code: 'BracketLeft',
                        });
                        await nextTick();
                        await nextTick();
                        triggerEvent(root, 'keydown', {
                            key: 'ô',
                            code: 'KeyO',
                        });
                        await nextTick();
                        triggerEvent(root, 'keypress', {
                            key: 'ô',
                            code: 'KeyO',
                        });
                        triggerEvent(root, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hellô';
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac safari)', async () => {
                        triggerEvent(root, 'compositionstart', {});
                        triggerEvent(root, 'compositionupdate', { data: '^' });
                        triggerEvent(root, 'beforeInput', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        text.textContent = 'hell^';
                        triggerEvent(root, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(root, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();
                        triggerEvent(root, 'beforeInput', {
                            data: 'null',
                            inputType: 'deleteContentBackwards',
                        });
                        triggerEvent(root, 'input', {
                            data: 'null',
                            inputType: 'deleteContentBackwards',
                        });
                        triggerEvent(root, 'beforeInput', {
                            data: 'ô',
                            inputType: 'insertFromComposition',
                        });
                        text.textContent = 'hellô';
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertFromComposition',
                        });
                        triggerEvent(root, 'compositionend', { data: 'ô' });
                        triggerEvent(root, 'keydown', { key: 'ô', code: 'KeyO' });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        triggerEvent(root, 'keyup', { key: 'o', code: 'KeyO' });
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macAccentKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                            {
                                events: [macKeystrokeKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac chrome)', async () => {
                        triggerEvent(root, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        triggerEvent(root, 'compositionstart', {});
                        triggerEvent(root, 'compositionupdate', { data: '^' });
                        triggerEvent(root, 'beforeInput', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        text.textContent = 'hell^';
                        triggerEvent(root, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();

                        triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(root, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(root, 'compositionupdate', { data: 'ô' });
                        text.textContent = 'hellô';
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(root, 'compositionend', { data: 'ô' });
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macAccentKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                            {
                                events: [macKeystrokeKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac firefox)', async () => {
                        triggerEvent(root, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        triggerEvent(root, 'compositionstart', {});
                        triggerEvent(root, 'compositionupdate', { data: '^' });
                        text.textContent = 'hell^';
                        triggerEvent(root, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();

                        triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(root, 'compositionupdate', { data: 'ô' });
                        triggerEvent(root, 'compositionend', { data: 'ô' });
                        text.textContent = 'hellô';
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertCompositionText',
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macAccentKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                            {
                                events: [macKeystrokeKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (SwiftKey)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Unidentified',
                        });
                        triggerEvent(root, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hellô';
                        triggerEvent(root, 'input', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();

                        const keyboardEvent: NormalizedKeyboardEvent = {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: 'ô',
                            code: '',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'insertText',
                                    text: 'ô',
                                },
                            ],
                        };

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'id': 'a', 'index': 0, 'offset': 4 },
                                    'anchor': { 'id': 'a', 'index': 0, 'offset': 4 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': 'ô', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'ô', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'textContent': 'hellô',
                                    'targetParentId': 'a',
                                    'targetIndex': 0,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'id': 'a', 'index': 0, 'offset': 5 },
                                    'anchor': { 'id': 'a', 'index': 0, 'offset': 5 },
                                },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                it('should insert multiples key in same stack (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                    triggerEvent(root, 'keypress', { key: 'o', code: 'KeyO' });
                    triggerEvent(root, 'beforeinput', { data: 'o', inputType: 'insertText' });
                    text.textContent = 'hello';
                    triggerEvent(root, 'input', { data: 'o', inputType: 'insertText' });
                    setRange(text, 5, text, 5);
                    triggerEvent(root, 'keydown', { key: 'i', code: 'KeyI' });
                    triggerEvent(root, 'keypress', { key: 'i', code: 'KeyI' });
                    triggerEvent(root, 'beforeinput', { data: 'i', inputType: 'insertText' });
                    text.textContent = 'helloi';
                    triggerEvent(root, 'input', { data: 'i', inputType: 'insertText' });
                    setRange(text, 6, text, 6);
                    triggerEvent(root, 'keydown', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(root, 'keypress', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(root, 'beforeinput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'hello';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 5, text, 5);
                    await nextTick();

                    const keyboardEvents: NormalizedKeyboardEvent[] = [
                        {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: 'o',
                            code: 'KeyO',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'insertText',
                                    text: 'o',
                                },
                            ],
                        },
                        {
                            type: 'keyboard',
                            inputType: 'insertText',
                            key: 'i',
                            code: 'KeyI',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'insertText',
                                    text: 'i',
                                },
                            ],
                        },
                        {
                            type: 'keyboard',
                            inputType: 'deleteContentBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteContent',
                                    direction: Direction.BACKWARD,
                                },
                            ],
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            events: keyboardEvents,
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it.skip('multi keypress with accent (mac)', async () => {
                    const p = document.createElement('p');
                    p.id = 'a';
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    await triggerEvents([[{ type: 'keydown', key: 'd', code: 'KeyD' }]]);
                    await nextTick();

                    const keyboardEvents: NormalizedKeyboardEvent[] = [];
                    const batchEvents: EventBatch[] = [
                        {
                            events: keyboardEvents,
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('completion/correction', () => {
                it('should add space when hitting a word completion (SwiftKey)', async () => {
                    root.innerHTML = testContentNormalizer.ahello;
                    const p = document.getElementById('a');
                    const text = p.childNodes[0];
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];

                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: 'hello' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
                    triggerEvent(root, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionend', { data: 'hello' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'a hello ';
                    triggerEvent(root, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    setRange(text, 8, text, 8);
                    await nextTick();
                    await nextTick();

                    const virtualKeyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: ' ',
                        code: '',
                        inputType: 'insertText',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [virtualKeyboardEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should add space from auto-correction (SwiftKey)', async () => {
                    root.innerHTML = testContentNormalizer.ahillo;
                    const p = document.getElementById('a');
                    const text = p.childNodes[0];
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: 'hillo' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
                    triggerEvent(root, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionend', { data: 'hello' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'a hello ';
                    triggerEvent(root, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    setRange(text, 8, text, 8);
                    await nextTick();
                    await nextTick();

                    // todo: split in two events rather than one?
                    // there is 1) the composition event and 2) the space event
                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'hillo',
                        compositionTo: 'hello ',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 7,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'hello',
                                type: 'insertText',
                            },
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                // ? why?
                it('prevent default the keypress', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keyup', { key: 'Dead', code: 'BracketLeft' }); // no keydown, no keypress
                    await nextTick();
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                    await nextTick();
                    const ev = triggerEvent(root, 'keypress', { key: 'ô', code: 'KeyO' });
                    ev.preventDefault();
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'ô',
                        code: 'KeyO',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: true,
                        // ? should be inputType isn't it?
                        // ? we should have action isn't it?
                        actions: [],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set(),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('delete', () => {
                describe('deleteContentBackward with backspace', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hello;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 5, text, 5);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteContentBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteContent',
                                    direction: Direction.BACKWARD,
                                },
                            ],
                        };

                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        // virtual keyboards does not provide code
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });
                    it('should deleteContentBackward with backspace (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', { key: 'Backspace', code: 'Backspace' });
                        triggerEvent(root, 'keypress', { key: 'Backspace', code: 'Backspace' });
                        triggerEvent(root, 'beforeinput', { inputType: 'deleteContentBackward' });
                        text.textContent = 'hell';
                        triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                        setRange(text, 4, text, 4);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentBackward with backspace (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Backspace', code: 'Backspace' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentBackward with backspace (SwiftKey)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(root, 'keypress', { key: 'Unidentified', code: '' });
                        triggerEvent(root, 'beforeinput', { inputType: 'deleteContentBackward' });
                        text.textContent = 'hell';
                        triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                        setRange(text, 4, text, 4);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentBackward with backspace (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 5 },
                                    anchor: { id: 'a', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'compositionstart', data: '' },
                                { type: 'compositionupdate', data: 'hello' },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: 'hell',
                                    inputType: 'insertCompositionText',
                                },
                                { type: 'compositionupdate', data: 'hell' },
                                { type: 'input', data: 'hell', inputType: 'insertCompositionText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteContentForward with delete', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hello;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 4, text, 4);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteContentForward',
                            key: 'Delete',
                            code: 'Delete',
                            altKey: false,
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteContent',
                                    direction: Direction.FORWARD,
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('should deleteContentForward with delete (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', { key: 'Delete', code: 'Delete' });
                        triggerEvent(root, 'keypress', { key: 'Delete', code: 'Delete' });
                        triggerEvent(root, 'beforeinput', { inputType: 'deleteContentForward' });
                        text.textContent = 'hell';
                        triggerEvent(root, 'input', { inputType: 'deleteContentForward' });
                        setRange(text, 4, text, 4);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentForward with delete (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 4 },
                                    anchor: { id: 'a', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    // todo: ask chm: how to trigger delete with SwiftKey?
                    it.skip('should deleteContentForward with delete (SwiftKey)', async () => {
                        const p = document.createElement('p');
                        const text = document.createTextNode('hello');
                        root.innerHTML = '';
                        root.appendChild(p);
                        p.appendChild(text);
                        setRange(text, 5, text, 5);

                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(root, 'keypress', { key: 'Unidentified', code: '' });
                        triggerEvent(root, 'beforeinput', { inputType: 'deleteContentForward' });
                        text.textContent = 'hell';
                        triggerEvent(root, 'input', { inputType: 'deleteContentForward' });
                        setRange(text, 4, text, 4);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteWordBackward at the end of word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.hellototo;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 10, text, 10);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteWordBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'toto',
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('deleteWordBackward at the end of word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'keypress', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'beforeinput', { inputType: 'deleteWordBackward' });
                        text.textContent = 'hello ';
                        triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                        setRange(text, 6, text, 6);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward at the end of word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 10 },
                                    anchor: { id: 'a', index: 0, offset: 10 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 6 },
                                    anchor: { id: 'a', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteWordBackward word in middle of sencence', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.atestb;
                        p = document.getElementById('a');
                        text = p.childNodes[0];
                        setRange(text, 6, text, 6);
                        await nextTick();
                        eventBatchs = [];

                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteWordBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'test',
                                },
                            ],
                        };
                    });

                    it('deleteWordBackward word in middle of sencence (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteWordBackward' });
                        text.textContent = 'a  b';
                        text.textContent = 'a  b';
                        text.textContent = 'a\u00A0 b';
                        setRange(text, 2, text, 2);
                        triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward word in middle of sencence (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 6 },
                                    anchor: { id: 'a', index: 0, offset: 6 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 2 },
                                    anchor: { id: 'a', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteWordBackward word in middle of sencence with style', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let lastText: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.atestbBold;
                        p = document.getElementById('a');
                        lastText = p.lastChild;
                        b = document.getElementById('b');
                        setRange(lastText, 0, lastText, 0);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteWordBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'test',
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });

                    it('deleteWordBackward word in middle of sencence with style (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteWordBackward' });
                        p.removeChild(b);
                        setRange(lastText, 0, lastText, 0);
                        triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([b]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward word in middle of sencence with style (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 2, offset: 0 },
                                    anchor: { id: 'a', index: 2, offset: 0 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ id: 'b' }],
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 2 },
                                    anchor: { id: 'a', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([b]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('backspace multi-styled word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let lastText: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.multiStyled;
                        p = document.getElementById('a');
                        lastText = p.lastChild;
                        b = p.childNodes[1];
                        setRange(lastText, 1, lastText, 1);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteWordBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'test',
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });

                    it('backspace multi-styled word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteWordBackward' });
                        p.removeChild(b);
                        lastText.textContent = ' b';
                        lastText.textContent = '\u00A0b';
                        setRange(lastText, 0, lastText, 0);
                        triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([b, lastText]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('backspace multi-styled word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 2, offset: 1 },
                                    anchor: { id: 'a', index: 2, offset: 1 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'a' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'a',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 0, offset: 2 },
                                    anchor: { id: 'a', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([b, lastText]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('backspace whole line backward', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;
                    let text2: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.atestbcBold;
                        p = document.getElementById('a');
                        text = p.firstChild;
                        text2 = p.lastChild;
                        b = p.childNodes[1];
                        setRange(text2, 2, text2, 2);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteHardLineBackward',
                            key: 'Backspace',
                            code: 'Backspace',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: true,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteHardLine',
                                    direction: Direction.BACKWARD,
                                    domRange: {
                                        startContainer: text,
                                        startOffset: 0,
                                        endContainer: text2,
                                        endOffset: 2,
                                        direction: Direction.BACKWARD,
                                    },
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('backspace whole line backward (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                            shiftKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteHardLineBackward' });
                        p.removeChild(text);
                        p.removeChild(b);
                        text2.textContent = ', c';
                        setRange(text2, 0, text2, 0);
                        triggerEvent(root, 'input', { inputType: 'deleteHardLineBackward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text, b, text2]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('backspace whole line backward (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 2, offset: 2 },
                                    anchor: { id: 'a', index: 2, offset: 2 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Shift', code: 'ShiftLeft', shiftKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: '',
                                    targetParentId: 'a',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'a' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'a',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 0, parentId: 'a' }],
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'editable', index: 0, offset: 0 },
                                    anchor: { id: 'editable', index: 0, offset: 0 },
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    shiftKey: true,
                                },
                            ],
                            [{ type: 'keyup', key: 'Shift', code: 'ShiftLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text, b, text2]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('delete word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text2: ChildNode;
                    let text3: ChildNode;
                    let i: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.abcg;
                        p = document.getElementById('a');

                        text2 = p.childNodes[2];
                        i = p.childNodes[3];
                        text3 = p.childNodes[4];
                        setRange(text2, 3, text2, 3);

                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteWordForward',
                            key: 'Delete',
                            code: 'Delete',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.FORWARD,
                                    text: 'ctest',
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('delete word (ubuntu chrome)', async () => {
                        triggerEvent(root, 'keydown', {
                            key: 'Delete',
                            code: 'Delete',
                            ctrlKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteWordForward' });
                        text2.textContent = ' b, ';
                        p.removeChild(i);
                        text3.textContent = '\u00A0g';
                        setRange(text2, 4, text2, 4);
                        triggerEvent(root, 'input', { inputType: 'deleteWordForward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('delete word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 2, offset: 4 },
                                    anchor: { id: 'a', index: 2, offset: 4 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete', ctrlKey: true },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: ' b, ',
                                    targetParentId: 'a',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b,  g',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'a' }],
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text2, i]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('delete whole line forward', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text2: ChildNode;
                    let text3: ChildNode;
                    let i: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.abcg;
                        p = document.getElementById('a');

                        text2 = p.childNodes[2];
                        i = p.childNodes[3];
                        text3 = p.childNodes[4];
                        setRange(text2, 2, text2, 2);

                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            inputType: 'deleteHardLineForward',
                            key: 'Delete',
                            code: 'Delete',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: true,
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'deleteHardLine',
                                    direction: Direction.FORWARD,
                                    domRange: {
                                        startContainer: text2,
                                        startOffset: 2,
                                        endContainer: text3,
                                        endOffset: 2,
                                        direction: Direction.FORWARD,
                                    },
                                },
                            ],
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('delete whole line forward (ubuntu chrome)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(root, 'keydown', {
                            key: 'Delete',
                            code: 'Delete',
                            ctrlKey: true,
                            shiftKey: true,
                        });
                        triggerEvent(root, 'beforeInput', { inputType: 'deleteHardLineForward' });
                        text2.textContent = ' b';
                        p.removeChild(i);
                        p.removeChild(text3);
                        setRange(text2, 2, text2, 2);
                        triggerEvent(root, 'input', { inputType: 'deleteHardLineForward' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('delete whole line forward (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 2, offset: 2 },
                                    anchor: { id: 'a', index: 2, offset: 2 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                                {
                                    type: 'keydown',
                                    key: 'Shift',
                                    code: 'ShiftLeft',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'a',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'a' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: '',
                                    targetParentId: 'a',
                                    targetIndex: 4,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 4, parentId: 'a' }],
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [{ type: 'keyup', key: 'Shift', code: 'ShiftLeft', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [firefoxKeyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('delete whole line forward and do nothing', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text3: ChildNode;

                    beforeEach(async () => {
                        root.innerHTML = testContentNormalizer.abcg;
                        p = document.getElementById('a');

                        text3 = p.childNodes[4];
                        setRange(text3, 2, text3, 2);

                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
                            type: 'keyboard',
                            // todo: discuss with DMO: the inputType can be found in the event
                            //       'beforeInput' but only on google chrome. Do we add it ?
                            // inputType: 'deleteHardLineForward',
                            key: 'Delete',
                            code: 'Delete',
                            altKey: false,
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: true,
                            defaultPrevented: false,
                            actions: [],
                        };
                    });
                    it('delete whole line forward and do nothing (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 4, offset: 2 },
                                    anchor: { id: 'a', index: 4, offset: 2 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                                {
                                    type: 'keydown',
                                    key: 'Shift',
                                    code: 'ShiftLeft',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteHardLineForward',
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [{ type: 'keyup', key: 'Shift', code: 'ShiftLeft', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('delete whole line forward and do nothing (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'a', index: 4, offset: 2 },
                                    anchor: { id: 'a', index: 4, offset: 2 },
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    ctrlKey: true,
                                },
                                {
                                    type: 'keydown',
                                    key: 'Shift',
                                    code: 'ShiftLeft',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Delete',
                                    code: 'Delete',
                                    ctrlKey: true,
                                    shiftKey: true,
                                },
                            ],
                            [
                                {
                                    type: 'keyup',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    shiftKey: true,
                                },
                            ],
                            [{ type: 'keyup', key: 'Shift', code: 'ShiftLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                it('backspace (Edge)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 5, text, 5);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(root, 'keypress', { key: 'Backspace', code: 'Backspace' });
                    text.textContent = 'hell';
                    triggerEvent(root, 'input', {});
                    setRange(text, 4, text, 4);
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'Backspace',
                        code: 'Backspace',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'deleteContent',
                                direction: Direction.BACKWARD,
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('enter', () => {
                it('enter (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abcd</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 2, text, 2);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Enter', code: 'Enter' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertParagraph' });

                    const newText = document.createTextNode('ab');
                    p.insertBefore(newText, text);
                    text.textContent = 'cd';
                    const newP = document.createElement('p');
                    root.appendChild(newP);
                    newP.appendChild(text);
                    setRange(text, 0, text, 0);

                    triggerEvent(root, 'input', { inputType: 'insertParagraph' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'insertParagraph',
                        key: 'Enter',
                        code: 'Enter',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'insertParagraph',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('enter (SwiftKey)', async () => {
                    root.innerHTML = '<div>abcd</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 2, text, 2);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Enter', code: '' });
                    triggerEvent(root, 'keypress', { key: 'Enter', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertParagraph' });

                    const newText = document.createTextNode('ab');
                    p.insertBefore(newText, text);
                    text.textContent = 'cd';
                    const newP = document.createElement('p');
                    root.appendChild(newP);
                    newP.appendChild(text);
                    setRange(text, 0, text, 0);

                    triggerEvent(root, 'input', { inputType: 'insertParagraph' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'insertParagraph',
                        key: 'Enter',
                        code: '',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'insertParagraph',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('enter before a word (Gboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 4, text, 4);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionend', { data: 'def' });
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'keydown', { key: 'Enter', code: '' });
                    triggerEvent(root, 'keypress', { key: 'Enter', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertParagraph' });

                    text.textContent = 'abc def';
                    const newText = document.createTextNode('abc\u00A0');
                    p.insertBefore(newText, text);
                    text.textContent = 'def';
                    const newP = document.createElement('p');
                    root.appendChild(newP);
                    newP.appendChild(text);
                    setRange(text, 0, text, 0);

                    triggerEvent(root, 'input', { inputType: 'insertParagraph' });
                    triggerEvent(root, 'compositionstart', { data: '' });
                    triggerEvent(root, 'compositionupdate', { data: 'def' });

                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'insertParagraph',
                        key: 'Enter',
                        code: '',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'insertParagraph',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([text, newText, newP]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('enter after a word (Gboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 3, text, 3);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionend', { data: 'abc' });
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'keydown', { key: 'Enter', code: '' });
                    triggerEvent(root, 'keypress', { key: 'Enter', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertParagraph' });

                    const newText = document.createTextNode('abc');
                    p.insertBefore(newText, text);
                    text.textContent = ' def';
                    const newP = document.createElement('p');
                    root.appendChild(newP);
                    newP.appendChild(text);
                    text.textContent = 'def';
                    text.textContent = '\u00A0def';

                    setRange(text, 0, text, 0);

                    triggerEvent(root, 'input', { inputType: 'insertParagraph' });

                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'insertParagraph',
                        key: 'Enter',
                        code: '',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'insertParagraph',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('shift + enter (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abcd</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 2, text, 2);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Enter', code: 'Enter' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertLineBreak' });

                    const newText = document.createTextNode('ab');
                    p.insertBefore(newText, text);
                    text.textContent = 'cd';
                    const br = document.createElement('br');
                    p.insertBefore(br, text);
                    setRange(text, 0, text, 0);

                    triggerEvent(root, 'input', { inputType: 'insertLineBreak' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'insertLineBreak',
                        key: 'Enter',
                        code: 'Enter',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'insertText',
                                text: '\n',
                                html: '<br/>',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([newText, text, br]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('arrow', () => {
                it('arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
                    setRange(text, 3, text, 3);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'ArrowLeft',
                        code: 'ArrowLeft',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 3,
                                    endContainer: text,
                                    endOffset: 3,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                // ? when does these strange case comes from?
                it('strange case arrow without range', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    document.getSelection().removeAllRanges();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'ArrowLeft',
                        code: 'ArrowLeft',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: root,
                                    startOffset: 0,
                                    endContainer: root,
                                    endOffset: 0,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('shift + arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'ArrowLeft',
                        code: 'ArrowLeft',
                        shiftKey: true,
                    });
                    setRange(text, 4, text, 3);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'ArrowLeft',
                        code: 'ArrowLeft',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: true,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 3,
                                    endContainer: text,
                                    endOffset: 4,
                                    direction: Direction.BACKWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('shift + ctrl + arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 3, text, 3);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'ArrowRight',
                        code: 'ArrowRight',
                        shiftKey: true,
                        ctrlKey: true,
                    });
                    setRange(text, 3, text, 5);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'ArrowRight',
                        code: 'ArrowRight',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: true,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 3,
                                    endContainer: text,
                                    endOffset: 5,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('select all', () => {
                it('ctrl + a (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(root.childNodes[1].firstChild, 1, root.childNodes[1].firstChild, 1);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'a', code: 'KeyQ', ctrlKey: true });
                    setRange(root.firstChild.firstChild, 0, root.lastChild.lastChild, 1);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent1: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'Control',
                        code: 'ControlLeft',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [],
                    };
                    const keyboardEvent2: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'a',
                        code: 'KeyQ',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: root.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: root.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: root.lastChild.lastChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [keyboardEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('ctrl + a on content finished by br (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    setRange(root.childNodes[1].firstChild, 1, root.childNodes[1].firstChild, 1);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'a', code: 'KeyQ', ctrlKey: true });
                    setRange(
                        root.firstChild.firstChild,
                        0,
                        root.lastChild.lastChild.previousSibling,
                        0,
                    );
                    await nextTick();
                    await nextTick();

                    const keyboardEvent1: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'Control',
                        code: 'ControlLeft',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [],
                    };
                    const keyboardEvent2: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'a',
                        code: 'KeyQ',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: root.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: root.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: root.lastChild.lastChild.previousSibling,
                                    endOffset: 0,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [keyboardEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('ctrl + a (safari)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(root.childNodes[1].firstChild, 1, root.childNodes[1].firstChild, 1);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Meta', code: 'MetaLeft', metaKey: true });
                    await nextTick();
                    await nextTick();
                    triggerEvent(root, 'keydown', { key: 'a', code: 'KeyQ', metaKey: true });
                    triggerEvent(root, 'keypress', { key: 'a', code: 'KeyQ', metaKey: true });
                    await nextTick();
                    await nextTick();
                    setRange(root.firstChild.firstChild, 0, root.lastChild.lastChild, 1);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent1: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'Meta',
                        code: 'MetaLeft',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: true,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [],
                    };
                    const keyboardEvent2: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'a',
                        code: 'KeyQ',
                        altKey: false,
                        ctrlKey: false,
                        metaKey: true,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: root.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: root.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: root.lastChild.lastChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [keyboardEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('cut', () => {
                it('ctrl + x to cut', async () => {
                    root.innerHTML = '<div>abc<br/>abc<br/>abc</div>';
                    const div = root.firstChild;
                    const text1 = div.childNodes[0];
                    const br1 = div.childNodes[1];
                    const text2 = div.childNodes[2];
                    const br2 = div.childNodes[3];
                    const text3 = div.childNodes[4];
                    setRange(text1, 1, text3, 2);
                    await nextTick();

                    eventBatchs = [];

                    triggerEvent(root, 'keydown', { key: 'x', code: 'KeyX', ctrlKey: true });
                    triggerEvent(div, 'beforeinput', { inputType: 'deleteByCut' });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'bc\ndef\ngh');
                    dataTransfer.setData('text/html', '<div>bc<br/>def<br/>gh</div>');
                    triggerEvent(div, 'beforecut', { clipboardData: dataTransfer });
                    triggerEvent(div, 'cut', { clipboardData: dataTransfer });
                    (text1 as Text).textContent = 'ab';
                    div.removeChild(br1);
                    div.removeChild(text2);
                    div.removeChild(br2);
                    (text3 as Text).textContent = 'c';
                    triggerEvent(div, 'input', { inputType: 'deleteByCut' });
                    setRange(text3, 0, text3, 0);
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'x',
                        code: 'KeyX',
                        inputType: 'deleteByCut',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        // check with chm if the target should be here.
                        // it was not there before my changes but I think it was a
                        // mistake.
                        caretPosition: {
                            // todo: check (with chm) if it's the right offsetNode and offset
                            offsetNode: text1,
                            offset: 1,
                        },
                        actions: [
                            {
                                direction: Direction.FORWARD,
                                type: 'deleteContent',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([text1, br1, text2, br2, text3]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('paste', () => {
                it('ctrl + v to paste', async () => {
                    root.innerHTML = '<div>abc</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 1, text, 1);
                    await nextTick();

                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'v', code: 'KeyV', ctrlKey: true });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    dataTransfer.setData('text/html', '<div>b</div>');
                    triggerEvent(p, 'paste', { clipboardData: dataTransfer });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        key: 'v',
                        code: 'KeyV',
                        inputType: 'insertFromPaste',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: true,
                        // check with chm if the target should be here.
                        // it was not there before my changes but I think it was a
                        // mistake.
                        caretPosition: {
                            // todo: check (with chm) if it's the right offsetNode and offset
                            offsetNode: text,
                            offset: 1,
                        },
                        actions: [
                            {
                                html: '<div>b</div>',
                                text: 'b',
                                type: 'insertHtml',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('history', () => {
                it('ctrl + z (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'z', code: 'KeyW', ctrlKey: true });
                    triggerEvent(root, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(root, 'input', { inputType: 'historyUndo' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'historyUndo',
                        key: 'z',
                        code: 'KeyW',
                        caretPosition: {
                            offset: 4,
                            offsetNode: text,
                        },
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        defaultPrevented: false,
                        actions: [{ type: 'historyUndo' }],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('format', () => {
                it('ctrl + b (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 1, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'b', code: 'KeyB', ctrlKey: true });
                    triggerEvent(root, 'beforeinput', { inputType: 'formatBold' });
                    const text2 = document.createTextNode('h');
                    p.insertBefore(text2, text);
                    text.textContent = 'ello';
                    const text3 = document.createTextNode('ell');
                    p.insertBefore(text3, text);
                    text.textContent = 'o';
                    const span = document.createElement('span');
                    p.insertBefore(span, text3);
                    p.removeChild(span);
                    const b = document.createElement('b');
                    p.insertBefore(b, text3);
                    b.appendChild(text3);
                    setRange(text3, 0, text3, 3);
                    triggerEvent(root, 'input', { inputType: 'formatBold' });
                    await nextTick();
                    await nextTick();

                    const keyboardEvent: NormalizedKeyboardEvent = {
                        type: 'keyboard',
                        inputType: 'formatBold',
                        key: 'b',
                        code: 'KeyB',
                        altKey: false,
                        ctrlKey: true,
                        metaKey: false,
                        shiftKey: false,
                        caretPosition: {
                            offset: 1,
                            offsetNode: text,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                format: 'bold',
                                type: 'applyFormat',
                                data: null,
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [keyboardEvent],
                            mutatedElements: new Set([text2, text, text3, span, b]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            // todo: test modifier keys
            describe('modifier keys', () => {});
        });
        describe('pointer', () => {
            describe('set range', () => {
                it('click outside do nothing (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abc</div>';
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(other, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(other.firstChild, 1, other.firstChild, 1);
                    setRange(other.firstChild, 1, other.firstChild, 2);
                    triggerEvent(other, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    triggerEvent(other, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    await nextTick();
                    await nextTick();
                    expect(eventBatchs).to.deep.equal([]);
                });
                it('click on border set range at the begin (ubuntu chrome)', async () => {
                    root.innerHTML = '<div style="position: absolute; left: 250px;">abc</div>';
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 5,
                        clientY: 5,
                    });
                    setRange(other.firstChild, 1, other.firstChild, 1);
                    triggerEvent(root, 'click', { button: 2, detail: 0, clientX: 5, clientY: 5 });
                    triggerEvent(root, 'mouseup', { button: 2, detail: 0, clientX: 5, clientY: 5 });
                    await nextTick();
                    await nextTick();
                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: root,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: root,
                                    startOffset: 0,
                                    endContainer: root,
                                    endOffset: 0,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('right click outside do nothing (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abc</div>';
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(other, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(other.firstChild, 1, other.firstChild, 1);
                    triggerEvent(other, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(other.firstChild, 0, other.firstChild, 2);
                    await nextTick();
                    await nextTick();
                    expect(eventBatchs).to.deep.equal([]);
                });
                it('mouse setRange (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p1, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 10,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text2, 1);
                    triggerEvent(p2, 'click', { button: 2, detail: 0, clientX: 10, clientY: 25 });
                    triggerEvent(p2, 'mouseup', { button: 2, detail: 0, clientX: 10, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text1,
                                    startOffset: 1,
                                    endContainer: text2,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('mouse setRange contenteditable false', async () => {
                    root.innerHTML = 'abc<i contentEditable="false">test</i>def';
                    const text = root.firstChild;
                    const i = root.childNodes[1];
                    await nextTick();
                    eventBatchs = [];

                    triggerEvent(i, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 40,
                        clientY: 25,
                    });
                    setRange(text, 3, text, 3);
                    triggerEvent(i, 'click', { button: 2, detail: 0, clientX: 50, clientY: 5 });
                    triggerEvent(i, 'mouseup', { button: 2, detail: 0, clientX: 50, clientY: 5 });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: i.firstChild,
                            offset: 2,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: i.firstChild,
                                    startOffset: 2,
                                    endContainer: i.firstChild,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('touchdown setRange (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'touchstart', {
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 18,
                                clientY: 10,
                                target: p,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    await nextTick();
                    triggerEvent(p, 'touchend', {
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 18,
                                clientY: 10,
                                target: p,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 1,
                        detail: 1,
                        clientX: 18,
                        clientY: 10,
                    });
                    triggerEvent(p, 'click', { button: 1, detail: 1, clientX: 45, clientY: 10 });
                    setRange(text, 4, text, 4);
                    await nextTick();
                    triggerEvent(root, 'compositionstart', { data: '' });
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 4,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 4,
                                    endContainer: text,
                                    endOffset: 4,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('touchdown setRange move inside a word (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 3, text, 3);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'touchstart', {
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 24,
                                clientY: 10,
                                target: text,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    await nextTick();
                    triggerEvent(p, 'touchend', {
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 24,
                                clientY: 10,
                                target: p,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 1,
                        detail: 1,
                        clientX: 24,
                        clientY: 10,
                    });
                    triggerEvent(p, 'click', { button: 1, detail: 1, clientX: 24, clientY: 10 });
                    setRange(text, 2, text, 2);
                    await nextTick();
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 2,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('mouse setRange with contextMenu (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abc</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
                    setRange(text, 1, text, 1);
                    triggerEvent(p, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 1,
                                    endContainer: text,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('mouse setRange on input (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>ab<input/>cd</div>';
                    const p = root.firstChild;
                    const text1 = p.firstChild;
                    const input = p.childNodes[1];
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(input, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 30,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    triggerEvent(input, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 30,
                        clientY: 10,
                    });
                    triggerEvent(input, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 30,
                        clientY: 10,
                    });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: input,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: input,
                                    startOffset: 0,
                                    endContainer: input,
                                    endOffset: 0,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('completion/correction', () => {
                // todo: correct what?
                it('should correct a word (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a hillo b');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: 'hillo' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    text.textContent = 'a hello b';
                    triggerEvent(root, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'hello' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionend', { data: 'hello' });
                    setRange(text, 7, text, 7);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'hillo',
                        compositionTo: 'hello',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 7,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'hello',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                // todo: displace in pointer section?
                it('should auto-correct a word (safari)', async () => {
                    // same test in mutation normalizer for the change
                    // we test that the correction trigger only a input
                    // and don't trigger composition event
                    const p = document.createElement('p');
                    const text = document.createTextNode('And the mome rates outgrabe.');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 18, text, 18);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', {
                        data: 'raths',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'And the mome outgrabe.';
                    text.textContent = 'And the mome raths outgrabe.';
                    triggerEvent(root, 'input', {
                        data: 'raths',
                        inputType: 'insertReplacementText',
                    });
                    setRange(text, 13, text, 13);

                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'rates',
                        compositionTo: 'raths',
                        // todo: check if it's usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 13,
                                    endContainer: text,
                                    endOffset: 18,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'raths',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('should correct with bold (SwiftKey)', async () => {
                    root.innerHTML = '<div>.<b>chr</b>is .</div>';
                    const div = root.childNodes[0];
                    const b = div.childNodes[1];
                    const firstText = div.firstChild;
                    const textB = b.firstChild;
                    const text = div.childNodes[2];
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: 'chris' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'Christophe' });

                    div.removeChild(firstText); // remove first text node
                    b.removeChild(textB); // remove text in b
                    div.removeChild(b); // remove b
                    const newText = document.createTextNode('.');
                    div.insertBefore(newText, text); // re-create first text node
                    const newB = document.createElement('b');
                    newB.textContent = 'Christophe';
                    div.insertBefore(newB, text); // re-create b
                    text.textContent = '\u00A0.'; // update text node

                    triggerEvent(root, 'input', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionend', { data: 'Christophe' });
                    setRange(text, 1, text, 1);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'chris ',
                        compositionTo: 'Christophe ',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: textB,
                                    startOffset: 0,
                                    endContainer: text,
                                    endOffset: 2,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'Christophe',
                                type: 'insertText',
                            },
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 3,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([firstText, textB, b, newText, newB, text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('should complete with repeat (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('Ha ha ha ha ha');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 9, text, 9);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: '' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'beforeInput', {
                        data: 'ha',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'ha' });
                    text.textContent = 'Ha ha ha haha ha';
                    triggerEvent(root, 'input', { data: 'ha', inputType: 'insertCompositionText' });
                    triggerEvent(root, 'compositionend', { data: 'ha' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'Ha ha ha ha ha ha';
                    triggerEvent(root, 'input', { data: ' ', inputType: 'insertText' });
                    setRange(text, 12, text, 12);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: '',
                        compositionTo: 'ha ',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 9,
                                    endContainer: text,
                                    endOffset: 9,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'ha',
                                type: 'insertText',
                            },
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('should correct (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionend', { data: 'aXc' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'c def';
                    // in real googleKeyboard realase the mutation just after input without
                    // timeout, in this test it's impositble to do that. But the implementation
                    // use a setTimeout, the mutation stack is the same.
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertText', data: 'aXc' });
                    text.textContent = 'aXc def';
                    text.textContent = 'aXc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(root, 'input', { inputType: 'insertText', data: 'aXc' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'abc',
                        compositionTo: 'aXc',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 0,
                                    endContainer: text,
                                    endOffset: 3,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'aXc',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('should correct by same value (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionend', { data: 'abc' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'c def';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(root, 'beforeInput', { inputType: 'insertText', data: 'abc' });
                    text.textContent = 'abc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(root, 'input', { inputType: 'insertText', data: 'abc' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified', code: '' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'abc',
                        compositionTo: 'abc',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 0,
                                    endContainer: text,
                                    endOffset: 3,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'abc',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('completion on BR (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const br = document.createElement('br');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(br);
                    setRange(p, 0, p, 0);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', { data: '' });
                    triggerEvent(root, 'compositionupdate', { data: '' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionstart', { data: '' });
                    triggerEvent(root, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionupdate', { data: 'hello' });
                    const text = document.createTextNode('');
                    p.insertBefore(text, br);
                    p.removeChild(br);
                    text.textContent = 'hello';
                    triggerEvent(root, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    triggerEvent(root, 'compositionend', { data: 'hello' });
                    triggerEvent(root, 'keydown', { key: 'Unidentified' });
                    triggerEvent(root, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'hello ';
                    text.textContent = 'hello\u00A0';
                    setRange(text, 6, text, 6);
                    triggerEvent(root, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: '\n',
                        compositionTo: 'hello ',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: br,
                                    startOffset: 0,
                                    endContainer: br,
                                    endOffset: 1,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'hello',
                                type: 'insertText',
                            },
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text, br]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });

                it('should correct (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a brillig b');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(root, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', { inputType: 'insertReplacementText' });
                    text.textContent = 'a brill b';
                    triggerEvent(root, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    setRange(text, 7, text, 7);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'brillig',
                        compositionTo: 'brill',
                        // todo: check if it's usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 9,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'brill',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should correct in i tag (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const i = document.createElement('i');
                    const text = document.createTextNode('a brillig b');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(i);
                    i.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(root, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', { inputType: 'insertReplacementText' });
                    text.textContent = 'a  b';
                    text.textContent = 'a  b';
                    text.textContent = 'a  b';
                    text.textContent = 'a  b';
                    const newText = document.createTextNode('a ');
                    i.insertBefore(newText, text);
                    text.textContent = ' b';
                    const newText2 = document.createTextNode('brill');
                    i.insertBefore(newText2, text);
                    newText.textContent = 'a ';
                    newText.textContent = 'a brill';
                    i.removeChild(newText2);
                    triggerEvent(root, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(root, 'keyup', { key: 'Unidentified' });
                    setRange(text, 0, text, 0);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'brillig',
                        compositionTo: 'brill',
                        // todo: check if it's really usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 9,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'brill',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text, newText, newText2]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should correct at end (ubuntu chrome)', async () => {
                    root.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = root.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'slithy toes';
                    triggerEvent(root, 'input', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });
                    setRange(text, 11, text, 11);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'toves',
                        compositionTo: 'toes',
                        // todo: check if it's really usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 7,
                                    endContainer: text,
                                    endOffset: 12,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'toes',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should correct at middle (ubuntu chrome)', async () => {
                    root.innerHTML = '<p><i>’Twas brillig, and the slithy toves</i><br/></p>';
                    const p = root.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild as Text;
                    setRange(text, 6, text, 13);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', {
                        data: 'brill',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = '’Twas , and the slithy toves';
                    text.textContent = '’Twas\u00A0, and the slithy toves';
                    const text2 = document.createTextNode('’Twas ');
                    i.insertBefore(text2, text);
                    text.textContent = ', and the slithy toves';
                    const text3 = document.createTextNode('brill');
                    i.insertBefore(text3, text);
                    text2.textContent = '’Twas ';
                    text2.textContent = '’Twas brill';
                    i.removeChild(text3);

                    triggerEvent(root, 'input', {
                        data: 'brill',
                        inputType: 'insertReplacementText',
                    });
                    setRange(text2, 11, text2, 11);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        compositionFrom: 'brillig',
                        compositionTo: 'brill',
                        type: 'pointer',
                        // todo: check if it's really usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 6,
                                    endContainer: text,
                                    endOffset: 13,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'brill',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text, text2, text3]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should correct at end of i tag (ubuntu chrome)', async () => {
                    root.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = root.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });

                    text.textContent = 'slithy ';
                    text.textContent = 'slithy ';
                    const text2 = document.createTextNode('toes');
                    root.appendChild(text2);
                    const br = document.createElement('br');
                    root.insertBefore(br, text2);
                    text2.textContent = '';
                    root.removeChild(text2);
                    root.removeChild(br);
                    const span = document.createElement('span');
                    const text3 = document.createTextNode('toes');
                    span.appendChild(text3);
                    p.appendChild(span);
                    p.insertBefore(text3, span);
                    p.insertBefore(span, text3);
                    p.removeChild(span);
                    const i2 = document.createElement('i');
                    p.insertBefore(i2, text3);
                    i2.appendChild(text3);
                    i2.insertBefore(text, text3);
                    p.removeChild(i);

                    triggerEvent(root, 'input', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });
                    setRange(text3, 4, text3, 4);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'toves',
                        compositionTo: 'toes',
                        // todo: check if it's really usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 7,
                                    endContainer: text,
                                    endOffset: 12,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'toes',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text, text2, br, span, text3, i2, i]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('should correct (Edge)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a brillig b');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(root, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    eventBatchs = [];
                    text.textContent = 'a  b';
                    text.textContent = 'a brill b';
                    // await nextTick(); TODO with Edge next version
                    triggerEvent(root, 'input', {});
                    setRange(text, 7, text, 7);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        compositionFrom: 'brillig',
                        compositionTo: 'brill',
                        // todo: check if it's really usefull
                        // inputType: 'insertReplacementText',
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 2,
                                    endContainer: text,
                                    endOffset: 9,
                                    direction: Direction.BACKWARD,
                                },
                            },
                            {
                                text: 'brill',
                                type: 'insertText',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('select all', () => {
                it('mouse select (ubuntu chrome)', async () => {
                    root.innerHTML = 'a<br/>b';
                    const text = root.firstChild;
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 8,
                        clientY: 10,
                    });
                    setRange(text, 1, text, 1);
                    triggerEvent(root, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 8,
                        clientY: 10,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(root, 0, other.firstChild, 3);
                    await nextTick();
                    await nextTick();

                    const pointerEvent1: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text,
                                    startOffset: 1,
                                    endContainer: text,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const pointerEvent2: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: text,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: root,
                                    startOffset: 0,
                                    endContainer: other.firstChild,
                                    endOffset: 3,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [pointerEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('mouse select all on content wrap by br (ubuntu chrome)', async () => {
                    root.innerHTML = '<div><br/><br/>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = root.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = root.childNodes[2];
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p2, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 10,
                        clientY: 65,
                    });

                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 10,
                        clientY: 65,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(p1, 0, p3, 1);
                    await nextTick();
                    await nextTick();

                    const pointerEvent1: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text2,
                                    startOffset: 1,
                                    endContainer: text2,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const pointerEvent2: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: text2,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: p1,
                                    startOffset: 0,
                                    endContainer: p3,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [pointerEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('mouse select all with invisible content (ubuntu chrome)', async () => {
                    root.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1] as HTMLElement;
                    const text2 = p2.firstChild;
                    const p3 = root.childNodes[2];
                    await nextTick();
                    triggerEvent(p2, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: p2.offsetLeft,
                        clientY: p2.offsetTop,
                    });
                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: p2.offsetLeft,
                        clientY: p2.offsetTop,
                    });
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: text2,
                                    offset: 0,
                                },
                                domRange: {
                                    startContainer: text1,
                                    startOffset: 0,
                                    endContainer: p3,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('wrong mouse select all without event (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = root.childNodes[2];
                    await nextTick();
                    triggerEvent(p2, 'mousedown', { button: 2, detail: 1 });
                    setRange(text2, 0, text2, 1);
                    triggerEvent(p2, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();
                    expect(eventBatchs).to.deep.equal([]);
                });
                it('wrong mouse select all without event 2 (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = root.lastChild;
                    const text3 = p3.lastChild.firstChild;
                    await nextTick();
                    triggerEvent(p2, 'mousedown', { button: 2, detail: 1 });
                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    setRange(text1, 0, text3, 3);
                    await nextTick();
                    await nextTick();
                    expect(eventBatchs).to.deep.equal([]);
                });
                it('touch select all (android)', async () => {
                    root.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = root.childNodes[2];
                    setRange(text1, 0, text1, 0);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p2, 'touchstart', {
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 10,
                                clientY: 25,
                                target: p2,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    triggerEvent(p2, 'contextmenu', {
                        button: 0,
                        detail: 0,
                        clientX: 10,
                        clientY: 25,
                    });
                    setRange(text2, 1, text2, 1);
                    await nextTick();
                    triggerEvent(p2, 'touchend', {
                        button: 2,
                        detail: 0,
                        touches: [
                            new Touch({
                                clientX: 10,
                                clientY: 25,
                                target: p2,
                                identifier: Date.now(),
                            }),
                        ],
                    });
                    triggerEvent(p2, 'contextmenu', {
                        button: 0,
                        detail: 0,
                        clientX: 10,
                        clientY: 45,
                    });
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();

                    const pointerEvent1: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text2,
                                    startOffset: 1,
                                    endContainer: text2,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const pointerEvent2: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'selectAll',
                                carretPosition: {
                                    offsetNode: text2,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: text1,
                                    startOffset: 0,
                                    endContainer: p3,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [pointerEvent2],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('cut', () => {
                it('use mouse cut (ubuntu chrome)', async () => {
                    root.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    // todo: verify and changes the names for all the tests
                    const p = root.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 11,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text3, 2);
                    triggerEvent(root.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(root.lastChild, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 10,
                        clientY: 25,
                    });
                    triggerEvent(p, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 10,
                        clientY: 25,
                    });
                    await nextTick();
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'bc\ndef\ngh');
                    dataTransfer.setData('text/html', '<div>bc<br/>def<br/>gh</div>');
                    triggerEvent(p, 'beforecut', { clipboardData: dataTransfer });
                    triggerEvent(p, 'cut', { clipboardData: dataTransfer });
                    (text1 as Text).textContent = 'ab';
                    p.removeChild(br1);
                    p.removeChild(text2);
                    p.removeChild(br2);
                    (text3 as Text).textContent = 'i';
                    triggerEvent(p, 'input', { inputType: 'deleteByCut' });
                    setRange(text3, 0, text3, 0);
                    await nextTick();
                    await nextTick();

                    const pointerEvent1: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text3,
                            offset: 2,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text1,
                                    startOffset: 1,
                                    endContainer: text3,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const pointerEvent2: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'deleteByCut',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                direction: Direction.FORWARD,
                                type: 'deleteContent',
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [pointerEvent2],
                            mutatedElements: new Set([text1, br1, text2, br2, text3]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                // skip this test as we do not support Edge witout blink engine
                it.skip('use mouse cut (Edge)', async () => {
                    root.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    const p = root.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 11,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text3, 2);
                    triggerEvent(root.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(root.lastChild, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 10,
                        clientY: 25,
                    });
                    triggerEvent(p, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 10,
                        clientY: 25,
                    });
                    await nextTick();
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'bc\ndef\ngh');
                    dataTransfer.setData('text/html', '<div>bc<br/>def<br/>gh</div>');
                    triggerEvent(p, 'beforecut', { clipboardData: dataTransfer });
                    triggerEvent(p, 'cut', { clipboardData: dataTransfer });
                    (text1 as Text).textContent = 'ab';
                    p.removeChild(br1);
                    p.removeChild(text2);
                    p.removeChild(br2);
                    (text3 as Text).textContent = 'i';
                    triggerEvent(p, 'input', {});
                    setRange(text3, 0, text3, 0);
                    await nextTick();
                    await nextTick();

                    const pointerEvent1: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text3,
                            offset: 2,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: text1,
                                    startOffset: 1,
                                    endContainer: text3,
                                    endOffset: 2,
                                    direction: Direction.FORWARD,
                                },
                            },
                        ],
                    };
                    const pointerEvent2: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'deleteByCut',
                        caretPosition: {
                            offsetNode: text2,
                            offset: 1,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                direction: Direction.FORWARD,
                                type: 'deleteContent',
                            },
                        ],
                    };
                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent1],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [pointerEvent2],
                            mutatedElements: new Set([text1, br1, text2, br2, text3]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('paste', () => {
                // todo: currently the offset is 0 but should be 1.
                //       nby: I don't understand why. ask chm more infos
                it.skip('paste with context menu', async () => {
                    root.innerHTML = '<div>abc</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 1, text, 1);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
                    setRange(text, 1, text, 1);
                    triggerEvent(p, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    dataTransfer.setData('text/html', '<div>b</div>');
                    triggerEvent(p, 'paste', { clipboardData: dataTransfer });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromPaste',
                        caretPosition: {
                            offsetNode: text,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                html: '<div>b</div>',
                                text: 'b',
                                type: 'insertHtml',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('drag and drop', () => {
                it('from self content', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', { button: 0, detail: 1, clientX: 15, clientY: 5 });
                    await nextTick();
                    triggerEvent(p.firstChild, 'dragstart', { clientX: 15, clientY: 5 });
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    dataTransfer.setData('text/html', '<div>b</div>');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);
                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'deleteContent',
                                direction: Direction.FORWARD,
                            },
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<div>b</div>',
                                text: 'b',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from self empty link', async () => {
                    root.innerHTML =
                        '<div>a<a href="https://www.odoo.com"></a>c</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const a = p.childNodes[1];
                    const p2 = root.childNodes[1];
                    setRange(a, 0, a, 0);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(a, 'mousedown', { button: 0, detail: 1 });
                    await nextTick();
                    triggerEvent(a, 'dragstart', { clientX: 15, clientY: 5 });
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'https://www.odoo.com');
                    dataTransfer.setData('text/html', '<a href="https://www.odoo.com"></a>');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'deleteContent',
                                direction: Direction.FORWARD,
                            },
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<a href="https://www.odoo.com"></a>',
                                text: 'https://www.odoo.com',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from self custom content', async () => {
                    root.innerHTML = '<div>a<svg></svg>c</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const svg = root.querySelector('svg');
                    const p2 = root.childNodes[1];

                    svg.style['-moz-user-select'] = 'none';
                    svg.style['-khtml-user-select'] = 'none';
                    svg.style['-webkit-user-select'] = 'none';
                    svg.style['user-select'] = 'none';
                    svg.style['-khtml-user-drag'] = 'none';
                    svg.style['-webkit-user-drag'] = 'none';
                    svg.style.width = '10px';
                    svg.style.height = '10px';
                    p.addEventListener('dragstart', (ev: DragEvent) => {
                        ev.dataTransfer.setData('text/uri-list', 'svg');
                        ev.dataTransfer.setData('text/html', '<svg>unload content</svg>');
                    });

                    setRange(svg, 0, svg, 0);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(svg, 'mousedown', { button: 0, detail: 1 });
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    triggerEvent(svg, 'dragstart', {
                        clientX: 15,
                        clientY: 5,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    dataTransfer.setData('text/html', '<svg>unload content</svg>');
                    dataTransfer.setData('text/uri-list', 'svg');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'deleteContent',
                                direction: Direction.FORWARD,
                            },
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<svg>unload content</svg>',
                                text: 'svg',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from browser navbar link', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', '/mylink');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com/mylink');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html:
                                    '<a href="https://www.odoo.com/mylink">https://www.odoo.com/mylink</a>',
                                text: 'https://www.odoo.com/mylink',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from external text', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertText',
                                text: 'b',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from external content', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    dataTransfer.setData('text/html', '<div>b</div>');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<div>b</div>',
                                text: 'b',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from external image', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'https://www.odoo.com/logo.png');
                    dataTransfer.setData('text/html', '<img src="https://www.odoo.com/logo.png">');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com/logo.png');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<img src="https://www.odoo.com/logo.png">',
                                text: 'https://www.odoo.com/logo.png',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from external link', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'https://www.odoo.com');
                    dataTransfer.setData('text/html', '<a href="https://www.odoo.com">test</a>');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<a href="https://www.odoo.com">test</a>',
                                text: 'https://www.odoo.com',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from external empty link', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'https://www.odoo.com');
                    dataTransfer.setData('text/html', '<a href="https://www.odoo.com"></a>');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertHtml',
                                html: '<a href="https://www.odoo.com">https://www.odoo.com</a>',
                                text: 'https://www.odoo.com',
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
                it('from pictures folder', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];

                    const files = [];
                    ['abc', 'def'].forEach(data => {
                        files.push(
                            new File([data], data + '.text', {
                                type: 'text/plain',
                                lastModified: new Date().getTime(),
                            }),
                        );
                    });

                    const dataTransfer = new DataTransfer();
                    Object.defineProperty(dataTransfer, 'files', { value: files });
                    Object.defineProperty(dataTransfer, 'items', {
                        value: [
                            { kind: 'file', type: 'image/jpeg', getAsFile: (): File => files[0] },
                            { kind: 'file', type: 'image/jpeg', getAsFile: (): File => files[1] },
                        ],
                    });
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 12,
                        clientY: 25,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 12, clientY: 25 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        inputType: 'insertFromDrop',
                        caretPosition: {
                            offsetNode: p2.firstChild,
                            offset: 1,
                        },
                        defaultPrevented: true,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: p2.firstChild,
                                    startOffset: 1,
                                    endContainer: p2.firstChild,
                                    endOffset: 1,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                type: 'insertFiles',
                                files: files,
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('history', () => {
                it('mouse history undo (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: p.offsetLeft,
                        clientY: p.offsetTop,
                    });
                    setRange(text, 1, text, 1);
                    triggerEvent(p, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(root, 'input', { inputType: 'historyUndo' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        //? is it usefull with a pointer to have the target specified?
                        caretPosition: {
                            offsetNode: text,
                            offset: 0,
                        },
                        inputType: 'historyUndo',
                        defaultPrevented: false,
                        actions: [{ type: 'historyUndo' }],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });

            describe('format', () => {
                it('apply bold with context menu (or menu bar) (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);

                    await nextTick();
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
                    setRange(text, 1, text, 4);
                    triggerEvent(p, 'click', { button: 2, detail: 0 });
                    triggerEvent(p, 'mouseup', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();

                    eventBatchs = [];
                    triggerEvent(root, 'beforeinput', { inputType: 'formatBold' });
                    const text2 = document.createTextNode('h');
                    p.insertBefore(text2, text);
                    text.textContent = 'ello';
                    const text3 = document.createTextNode('ell');
                    p.insertBefore(text3, text);
                    text.textContent = 'o';
                    const span = document.createElement('span');
                    p.insertBefore(span, text3);
                    p.removeChild(span);
                    const b = document.createElement('b');
                    p.insertBefore(b, text3);
                    b.appendChild(text3);
                    setRange(text3, 0, text3, 3);
                    triggerEvent(root, 'input', { inputType: 'formatBold' });
                    await nextTick();
                    await nextTick();

                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: text,
                            offset: 0,
                        },
                        inputType: 'formatBold',
                        defaultPrevented: false,
                        actions: [
                            {
                                format: 'bold',
                                type: 'applyFormat',
                                data: null,
                            },
                        ],
                    };

                    const batchEvents: EventBatch[] = [
                        {
                            events: [pointerEvent],
                            mutatedElements: new Set([text2, text, text3, span, b]),
                        },
                    ];
                    expect(eventBatchs).to.deep.equal(batchEvents);
                });
            });
        });
    });
});
