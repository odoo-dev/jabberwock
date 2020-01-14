/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { Direction } from '../src/VRange';
import { testContentNormalizer, resetElementsIds } from './eventNormalizerUtils';
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

// todo: Maybe remove this. It was introduced because of backward compatibility.
interface RemovedNodesTargetMutationIndex {
    parentId: string;
    index: number;
}
// todo: Remove this. It was introduced because of backward compatibility.
interface RemovedNodesTargetMutationOnlyID {
    id: string;
}

interface RemovedNodesTargetMutationPreviousSibling {
    parentId: string;
    previousSiblingIndex: number;
}
// interface TargetMutationPreviousSibling {
//     parentId: string;
//     previousSiblingIndex: number;
// }

type RemovedNodesTargetMutation = (
    | RemovedNodesTargetMutationIndex
    | RemovedNodesTargetMutationOnlyID
    | RemovedNodesTargetMutationPreviousSibling)[];

interface AddedNodesTargetMutationNoIndex {
    parentId: string;
    nodeType: number;
    nodeValue: string;
}
interface AddedNodesTargetMutationPreviousSibling {
    parentId: string;
    previousSiblingIndex: number;
    nodeType: number;
    nodeValue: string;
}
interface AddedNodesTargetMutationNextSibling {
    parentId: string;
    nextSiblingIndex: number;
    nodeType: number;
    nodeValue: string;
}

type AddedNodesTargetMutation = (
    | AddedNodesTargetMutationNoIndex
    | AddedNodesTargetMutationPreviousSibling
    | AddedNodesTargetMutationNextSibling)[];

export interface TestMutationEvent {
    type: 'mutation';
    // todo: This is currently optionnal because of backward compatibility
    mutationType?: string;
    textContent: string;
    // if targetParentId is undefined, it means that we want to addNodes or removeNodes on the
    // editable itself.
    targetParentId?: string;
    targetIndex: number;
    removedNodes?: RemovedNodesTargetMutation;
    // removedNodes?:
    //     | TargetMutation
    //     | [];
    addedNodes?: AddedNodesTargetMutation;
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
            if (!node) debugger;
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
async function triggerEvents(eventStackList: TestEvent[][]): Promise<Node[]> {
    const addedNodes: Node[] = [];
    const editableElement = document.getElementById('editable');
    eventStackList.forEach(async eventStack => {
        resetOffsetCacheMap(editableElement);
        eventStack.forEach(testEvent => {
            if (testEvent.type === 'mutation') {
                const mutationEvent: TestMutationEvent = testEvent;
                let mutatedNode: Node;
                if (mutationEvent.targetParentId) {
                    mutatedNode = getNodeFromOffsetCacheMap(
                        mutationEvent.targetParentId,
                        mutationEvent.targetIndex,
                    );
                } else {
                    // todo: change this editable querySelector to be retrieved by an argument
                    mutatedNode = editableElement;
                }
                if (testEvent.mutationType === 'childList') {
                    if (testEvent.removedNodes) {
                        console.log('testEvent.removedNodes:', testEvent.removedNodes);
                        testEvent.removedNodes
                            .map(removedNodeDescription => {
                                // todo: remove this "if" and keep the "else" when regenerated events
                                //       it was introduced to keep compatible with the `id` key
                                if (
                                    (removedNodeDescription as RemovedNodesTargetMutationOnlyID).id
                                ) {
                                    return document.getElementById(
                                        (removedNodeDescription as RemovedNodesTargetMutationOnlyID)
                                            .id,
                                    );
                                } else if (
                                    typeof (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                        .index === 'number'
                                ) {
                                    return getNodeFromOffsetCacheMap(
                                        (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                            .parentId,
                                        (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                            .index,
                                    );
                                } else {
                                    const description = removedNodeDescription as RemovedNodesTargetMutationPreviousSibling;
                                    const previousSibling = getNodeFromOffsetCacheMap(
                                        description.parentId,
                                        description.previousSiblingIndex,
                                    );
                                    const childNodes = Array.from(
                                        previousSibling.parentNode.childNodes,
                                    );
                                    return childNodes[description.previousSiblingIndex + 1];
                                }
                                // else if (
                                //     (removedNodeDescription as TargetMutationPreviousSibling)
                                //         .previousSiblingIndex
                                // ) {
                                //     const previousSibling = getNodeFromOffsetCacheMap(
                                //         (removedNodeDescription as TargetMutationIndex).parentId,
                                //         (removedNodeDescription as TargetMutationIndex).index,
                                //     )
                                //     return {previousSibling.}
                                // };
                            })
                            .forEach(removedNode => {
                                removedNode.parentNode.removeChild(removedNode);
                            });
                    } else if (testEvent.addedNodes) {
                        testEvent.addedNodes.forEach(addedNodeDescription => {
                            debugger;
                            let addedNode: Node;
                            if (addedNodeDescription.nodeType === Node.ELEMENT_NODE) {
                                const div = document.createElement('div');
                                div.innerHTML = addedNodeDescription.nodeValue;
                                addedNode = div.firstChild;
                                addedNodes.push(addedNode);

                                // if a node is an element and is added, we need to cache it in the
                                // offsetmap because other mutation event might reference this added
                                // node in the same stack.
                                console.log('add node to offsetcachemap', addedNode);
                            } else if (addedNodeDescription.nodeType === Node.TEXT_NODE) {
                                addedNode = document.createTextNode(addedNodeDescription.nodeValue);
                                addedNodes.push(addedNode);
                            } else {
                                throw new Error('Unknown node type');
                            }

                            if (
                                typeof (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                    .previousSiblingIndex === 'number'
                            ) {
                                const previousSibling = getNodeFromOffsetCacheMap(
                                    addedNodeDescription.parentId,
                                    (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                        .previousSiblingIndex,
                                );
                                (previousSibling as ChildNode).after(addedNode);
                            } else if (
                                typeof (addedNodeDescription as AddedNodesTargetMutationNextSibling)
                                    .nextSiblingIndex === 'number'
                            ) {
                                const netxSibling = getNodeFromOffsetCacheMap(
                                    addedNodeDescription.parentId,
                                    (addedNodeDescription as AddedNodesTargetMutationNextSibling)
                                        .nextSiblingIndex,
                                );
                                (netxSibling as ChildNode).before(addedNode);
                            } else {
                                const parentNode = document.getElementById(
                                    addedNodeDescription.parentId,
                                );
                                if (!parentNode) debugger;
                                parentNode.appendChild(addedNode);
                            }
                            if (!addedNode.parentNode) debugger;
                            addNodeToOffsetCacheMap(addedNode.parentNode);
                        });
                    }
                } else if (mutationEvent.mutationType === 'characterData') {
                    debugger;
                    console.log('mutationEvent:', mutationEvent);
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
    return addedNodes;
}

// ? is all the tests special cases that we handle because the browser are doing something
// that is not conform to a standard or is it just a normal flow that we test?
// We might want to separate the two tests to make the distinction clear.
// maybe we simply add after each title (*special case*)?

describe('utils', () => {
    describe.only('EventNormalizer', () => {
        let container: HTMLElement;
        let editable: HTMLElement;
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
            editable = document.createElement('div');
            editable.id = 'editable';
            editable.style.display = 'block';
            container.appendChild(editable);
            // ? why do we create other?
            other = document.createElement('div');
            other.innerText = 'abc';
            container.appendChild(other);
            document.body.appendChild(container);
            normalizer = new EventNormalizer(editable, callback);
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
            editable.innerHTML = '<span>i</span>';
            const rect = (editable.firstChild as HTMLElement).getBoundingClientRect();
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
                        editable.innerHTML = testContentNormalizer.hell;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        triggerEvent(editable, 'keydown', {
                            key: 'o',
                            code: 'KeyO',
                        });
                        await nextTick();
                        triggerEvent(editable, 'keypress', {
                            key: 'o',
                            code: 'KeyO',
                        });
                        triggerEvent(editable, 'beforeinput', {
                            data: 'o',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello';
                        triggerEvent(editable, 'input', {
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
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'o', code: 'KeyO' },
                                { type: 'keypress', key: 'o', code: 'KeyO' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
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
                    it('should insert char at the end of a word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
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
                                    mutationType: 'characterData',
                                    textContent: 'hello',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (SwiftKey)', async () => {
                        editable.innerHTML = '';
                        editable.innerHTML = "<p id='element-0'>hell<br/>world</p>";
                        const p = document.getElementById('element-0');
                        const text = p.childNodes[0];
                        await nextTick();
                        eventBatchs = [];

                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                { type: 'beforeinput', data: 'o', inputType: 'insertText' },
                                { type: 'input', data: 'o', inputType: 'insertText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
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
                        editable.innerHTML = testContentNormalizer.hello;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        triggerEvent(editable, 'keydown', {
                            key: ' ',
                            code: 'Space',
                        });
                        await nextTick();
                        triggerEvent(editable, 'keypress', {
                            key: ' ',
                            code: 'Space',
                        });
                        triggerEvent(editable, 'beforeinput', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello ';
                        triggerEvent(editable, 'input', {
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
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: ' ', code: 'Space' },
                                { type: 'keypress', key: ' ', code: 'Space' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
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
                    it('should insert space at the end of a word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: ' ', code: 'Space' },
                                { type: 'keypress', key: ' ', code: 'Space' },
                                { type: 'beforeinput', data: ' ', inputType: 'insertText' },
                                { type: 'input', data: ' ', inputType: 'insertText' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keyup', key: ' ', code: 'Space' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (SwiftKey)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', {
                            key: 'Unidentified',
                            code: '',
                        });
                        await nextTick();
                        triggerEvent(editable, 'beforeinput', {
                            data: ' ',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hello ';
                        triggerEvent(editable, 'input', {
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
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
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
                        editable.innerHTML = testContentNormalizer.hell;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        triggerEvent(editable, 'keyup', { key: 'Dead', code: 'BracketLeft' }); // no keydown, no keypress
                        await nextTick();
                        await nextTick();
                        triggerEvent(editable, 'keydown', { key: 'o', code: 'KeyO' });
                        await nextTick();
                        triggerEvent(editable, 'keypress', { key: 'ô', code: 'KeyO' });
                        triggerEvent(editable, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        triggerEvent(editable, 'input', {
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
                        triggerEvent(editable, 'keydown', {
                            // no keypress
                            key: 'Dead',
                            code: 'BracketLeft',
                        });
                        await nextTick();
                        await nextTick();
                        triggerEvent(editable, 'keydown', {
                            key: 'ô',
                            code: 'KeyO',
                        });
                        await nextTick();
                        triggerEvent(editable, 'keypress', {
                            key: 'ô',
                            code: 'KeyO',
                        });
                        triggerEvent(editable, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hellô';
                        triggerEvent(editable, 'input', {
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
                        triggerEvent(editable, 'compositionstart', {});
                        triggerEvent(editable, 'compositionupdate', { data: '^' });
                        triggerEvent(editable, 'beforeInput', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        text.textContent = 'hell^';
                        triggerEvent(editable, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(editable, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();
                        triggerEvent(editable, 'beforeInput', {
                            data: 'null',
                            inputType: 'deleteContentBackwards',
                        });
                        triggerEvent(editable, 'input', {
                            data: 'null',
                            inputType: 'deleteContentBackwards',
                        });
                        triggerEvent(editable, 'beforeInput', {
                            data: 'ô',
                            inputType: 'insertFromComposition',
                        });
                        text.textContent = 'hellô';
                        triggerEvent(editable, 'input', {
                            data: 'ô',
                            inputType: 'insertFromComposition',
                        });
                        triggerEvent(editable, 'compositionend', { data: 'ô' });
                        triggerEvent(editable, 'keydown', { key: 'ô', code: 'KeyO' });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        triggerEvent(editable, 'keyup', { key: 'o', code: 'KeyO' });
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
                        triggerEvent(editable, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        triggerEvent(editable, 'compositionstart', {});
                        triggerEvent(editable, 'compositionupdate', { data: '^' });
                        triggerEvent(editable, 'beforeInput', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        text.textContent = 'hell^';
                        triggerEvent(editable, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();

                        triggerEvent(editable, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(editable, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(editable, 'compositionupdate', { data: 'ô' });
                        text.textContent = 'hellô';
                        triggerEvent(editable, 'input', {
                            data: 'ô',
                            inputType: 'insertCompositionText',
                        });
                        triggerEvent(editable, 'compositionend', { data: 'ô' });
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
                        triggerEvent(editable, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        triggerEvent(editable, 'compositionstart', {});
                        triggerEvent(editable, 'compositionupdate', { data: '^' });
                        text.textContent = 'hell^';
                        triggerEvent(editable, 'input', {
                            data: '^',
                            inputType: 'insertCompositionText',
                        });
                        setRange(text, 5, text, 5);
                        await nextTick();
                        await nextTick();

                        triggerEvent(editable, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(editable, 'compositionupdate', { data: 'ô' });
                        triggerEvent(editable, 'compositionend', { data: 'ô' });
                        text.textContent = 'hellô';
                        triggerEvent(editable, 'input', {
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
                        triggerEvent(editable, 'keydown', {
                            key: 'Unidentified',
                        });
                        triggerEvent(editable, 'beforeinput', {
                            data: 'ô',
                            inputType: 'insertText',
                            cancelable: false,
                            composed: true,
                        });
                        text.textContent = 'hellô';
                        triggerEvent(editable, 'input', {
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
                                    'focus': { 'id': 'element-0', 'index': 0, 'offset': 4 },
                                    'anchor': { 'id': 'element-0', 'index': 0, 'offset': 4 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': 'ô', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'ô', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'textContent': 'hellô',
                                    'targetParentId': 'element-0',
                                    'targetIndex': 0,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'id': 'element-0', 'index': 0, 'offset': 5 },
                                    'anchor': { 'id': 'element-0', 'index': 0, 'offset': 5 },
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'o', code: 'KeyO' });
                    triggerEvent(editable, 'keypress', { key: 'o', code: 'KeyO' });
                    triggerEvent(editable, 'beforeinput', { data: 'o', inputType: 'insertText' });
                    text.textContent = 'hello';
                    triggerEvent(editable, 'input', { data: 'o', inputType: 'insertText' });
                    setRange(text, 5, text, 5);
                    triggerEvent(editable, 'keydown', { key: 'i', code: 'KeyI' });
                    triggerEvent(editable, 'keypress', { key: 'i', code: 'KeyI' });
                    triggerEvent(editable, 'beforeinput', { data: 'i', inputType: 'insertText' });
                    text.textContent = 'helloi';
                    triggerEvent(editable, 'input', { data: 'i', inputType: 'insertText' });
                    setRange(text, 6, text, 6);
                    triggerEvent(editable, 'keydown', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(editable, 'keypress', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(editable, 'beforeinput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'hello';
                    triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
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
                    editable.innerHTML = testContentNormalizer.hell;
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];

                    await nextTick();
                    eventBatchs = [];
                    await triggerEvents([
                        [
                            {
                                type: 'selection',
                                focus: { id: 'element-0', index: 0, offset: 4 },
                                anchor: { id: 'element-0', index: 0, offset: 4 },
                            },
                        ],
                        [
                            { type: 'keydown', key: 'Dead', code: 'BracketLeft' },
                            { type: 'compositionstart', data: '' },
                            { type: 'beforeinput', data: '^', inputType: 'insertCompositionText' },
                            { type: 'compositionupdate', data: '^' },
                            { type: 'input', data: '^', inputType: 'insertCompositionText' },
                            {
                                type: 'mutation',
                                mutationType: 'characterData',
                                textContent: 'hell^',
                                targetParentId: 'element-0',
                                targetIndex: 0,
                            },
                            {
                                type: 'selection',
                                focus: { id: 'element-0', index: 0, offset: 5 },
                                anchor: { id: 'element-0', index: 0, offset: 5 },
                            },
                            { type: 'keydown', key: 'ô', code: 'KeyO' },
                            { type: 'beforeinput', data: 'ô', inputType: 'insertCompositionText' },
                            { type: 'compositionupdate', data: 'ô' },
                            { type: 'input', data: 'ô', inputType: 'insertCompositionText' },
                            {
                                type: 'mutation',
                                mutationType: 'characterData',
                                textContent: 'hellô',
                                targetParentId: 'element-0',
                                targetIndex: 0,
                            },
                            {
                                type: 'selection',
                                focus: { id: 'element-0', index: 0, offset: 5 },
                                anchor: { id: 'element-0', index: 0, offset: 5 },
                            },
                            {
                                type: 'selection',
                                focus: { id: 'element-0', index: 0, offset: 5 },
                                anchor: { id: 'element-0', index: 0, offset: 5 },
                            },
                        ],
                        [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                        [{ type: 'keyup', key: 'Dead', code: 'BracketLeft' }],
                    ]);

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
                    editable.innerHTML = testContentNormalizer.ahello;
                    resetElementsIds(editable);
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];

                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'compositionupdate', { data: 'hello' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
                    triggerEvent(editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionend', { data: 'hello' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'a hello ';
                    triggerEvent(editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
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
                    editable.innerHTML = testContentNormalizer.ahillo;
                    resetElementsIds(editable);
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'compositionupdate', { data: 'hillo' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
                    triggerEvent(editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionend', { data: 'hello' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'a hello ';
                    triggerEvent(editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keyup', { key: 'Dead', code: 'BracketLeft' }); // no keydown, no keypress
                    await nextTick();
                    await nextTick();
                    triggerEvent(editable, 'keydown', { key: 'o', code: 'KeyO' });
                    await nextTick();
                    const ev = triggerEvent(editable, 'keypress', { key: 'ô', code: 'KeyO' });
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

            describe('backspace', () => {
                describe('deleteContentBackward with backspace', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.hello;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        triggerEvent(editable, 'keydown', { key: 'Backspace', code: 'Backspace' });
                        triggerEvent(editable, 'keypress', { key: 'Backspace', code: 'Backspace' });
                        triggerEvent(editable, 'beforeinput', {
                            inputType: 'deleteContentBackward',
                        });
                        text.textContent = 'hell';
                        triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
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
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Backspace', code: 'Backspace' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
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
                    it('should deleteContentBackward with backspace (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Backspace', code: 'Backspace' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentBackward with backspace (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Backspace', code: 'Backspace' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Backspace', code: 'Backspace' },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentBackward with backspace (SwiftKey)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'keypress', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'beforeinput', {
                            inputType: 'deleteContentBackward',
                        });
                        text.textContent = 'hell';
                        triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
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
                                    focus: { id: 'element-0', index: 0, offset: 5 },
                                    anchor: { id: 'element-0', index: 0, offset: 5 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
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
                describe('deleteWordBackward or deleteContentBackward at the end of word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.hellototo;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        virtualKeyboardEvent = {
                            ...keyboardEvent,
                            code: '',
                            ctrlKey: false,
                            inputType: 'deleteContentBackward',
                        };
                    });
                    it('deleteWordBackward at the end of word (ubuntu chrome)', async () => {
                        triggerEvent(editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(editable, 'keypress', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(editable, 'beforeinput', { inputType: 'deleteWordBackward' });
                        text.textContent = 'hello ';
                        triggerEvent(editable, 'input', { inputType: 'deleteWordBackward' });
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
                                    focus: { id: 'element-0', index: 0, offset: 10 },
                                    anchor: { id: 'element-0', index: 0, offset: 10 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
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
                    it('deleteWordBackward at the end of word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 10 },
                                    anchor: { id: 'element-0', index: 0, offset: 10 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward at the end of word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 10 },
                                    anchor: { id: 'element-0', index: 0, offset: 10 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteContentBackward at the end of word (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 10 },
                                    anchor: { id: 'element-0', index: 0, offset: 10 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'hello ',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    // GBoard does not provide a way to delete a word with
                    // deleteWordBackward nor deleteWordBackward.
                });
                describe('deleteWordBackward or deleteContentBackward word in middle of sencence', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.atestb;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
                        text = p.childNodes[0];
                        setRange(text, 6, text, 6);
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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        virtualKeyboardEvent = {
                            ...keyboardEvent,
                            code: '',
                            ctrlKey: false,
                            inputType: 'deleteContentBackward',
                        };
                    });

                    it('deleteWordBackward word in middle of sencence (ubuntu chrome)', async () => {
                        triggerEvent(editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(editable, 'beforeInput', { inputType: 'deleteWordBackward' });
                        text.textContent = 'a  b';
                        text.textContent = 'a  b';
                        text.textContent = 'a\u00A0 b';
                        setRange(text, 2, text, 2);
                        triggerEvent(editable, 'input', { inputType: 'deleteWordBackward' });
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
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
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
                    it('deleteWordBackward word in middle of sencence (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [
                                { type: 'keyup', key: 'Alt', code: 'AltLeft' },
                                { type: 'keyup', key: 'Meta', code: 'MetaLeft' },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                            [
                                { type: 'keyup', key: 'Alt', code: 'AltLeft' },
                                { type: 'keyup', key: 'Meta', code: 'MetaLeft' },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward word in middle of sencence (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteContentBackward word in middle of sencence (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 6 },
                                    anchor: { id: 'element-0', index: 0, offset: 6 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'a  b',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteWordBackward or deleteContentBackward word in middle of sencence with style', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let lastText: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.atestbBold;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
                        lastText = p.lastChild;
                        b = document.getElementById('element-1');
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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        virtualKeyboardEvent = {
                            ...keyboardEvent,
                            code: '',
                            ctrlKey: false,
                            inputType: 'deleteContentBackward',
                        };
                    });

                    it('deleteWordBackward word in middle of sencence with style (ubuntu chrome)', async () => {
                        triggerEvent(editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(editable, 'beforeInput', { inputType: 'deleteWordBackward' });
                        p.removeChild(b);
                        setRange(lastText, 0, lastText, 0);
                        triggerEvent(editable, 'input', { inputType: 'deleteWordBackward' });
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
                                    focus: { id: 'element-0', index: 2, offset: 0 },
                                    anchor: { id: 'element-0', index: 2, offset: 0 },
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
                                    removedNodes: [{ id: 'element-1' }],
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
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
                    it('deleteWordBackward word in middle of sencence with style (mac safari)', async () => {
                        const addedNodes = await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-1', index: 0, offset: 4 },
                                    anchor: { id: 'element-1', index: 0, offset: 4 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    addedNodes: [
                                        {
                                            parentId: 'element-0',
                                            previousSiblingIndex: 1,
                                            nodeType: 1,
                                            nodeValue:
                                                '<span style="font-weight: bold; display: inline"></span>',
                                        },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [
                                        { parentId: 'element-0', previousSiblingIndex: 1 },
                                    ],
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                            [
                                { type: 'keyup', key: 'Alt', code: 'AltLeft' },
                                { type: 'keyup', key: 'Meta', code: 'MetaLeft' },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([b, addedNodes[0]]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward word in middle of sencence with style (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-1', index: 0, offset: 4 },
                                    anchor: { id: 'element-1', index: 0, offset: 4 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([b]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteContentBackward word in middle of sencence with style (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-1', index: 0, offset: 4 },
                                    anchor: { id: 'element-1', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a , b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([b]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteWordBackward or deleteContentBackward multi-styled word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let lastText: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.multiStyled;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                        virtualKeyboardEvent = {
                            ...keyboardEvent,
                            code: '',
                            ctrlKey: false,
                            inputType: 'deleteContentBackward',
                        };
                    });

                    it('deleteWordBackward multi-styled word (ubuntu chrome)', async () => {
                        triggerEvent(editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                        });
                        triggerEvent(editable, 'beforeInput', { inputType: 'deleteWordBackward' });
                        p.removeChild(b);
                        lastText.textContent = ' b';
                        lastText.textContent = '\u00A0b';
                        setRange(lastText, 0, lastText, 0);
                        triggerEvent(editable, 'input', { inputType: 'deleteWordBackward' });
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
                    it('deleteWordBackward multi-styled word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 1 },
                                    anchor: { id: 'element-0', index: 2, offset: 1 },
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
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
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
                    it('deleteWordBackward multi-styled word (mac safari)', async () => {
                        const addedNodes = await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 1 },
                                    anchor: { id: 'element-0', index: 2, offset: 1 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [
                                        { parentId: 'element-0', previousSiblingIndex: 0 },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    addedNodes: [
                                        {
                                            parentId: 'element-0',
                                            previousSiblingIndex: 1,
                                            nodeType: 1,
                                            nodeValue:
                                                '<span style="font-weight: bold; display: inline"></span>',
                                        },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [
                                        { parentId: 'element-0', previousSiblingIndex: 1 },
                                    ],
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([b, lastText, addedNodes[0]]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteWordBackward multi-styled word (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 1 },
                                    anchor: { id: 'element-0', index: 2, offset: 1 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    altKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteWordBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteWordBackward' },
                                {
                                    type: 'mutation',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Backspace', code: 'Backspace', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([b, lastText]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteContentBackward multi-styled word (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 1 },
                                    anchor: { id: 'element-0', index: 2, offset: 1 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Unidentified', code: '' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a  b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: ' b',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                { type: 'keyup', key: 'Unidentified', code: '' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 2 },
                                    anchor: { id: 'element-0', index: 0, offset: 2 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([b, lastText]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('deleteHardLineBackward or deleteSoftLineBackward', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let macChromeKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;
                    let text2: ChildNode;
                    let b: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.atestbcBold;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        macKeyboardEvent = {
                            ...keyboardEvent,
                            metaKey: true,
                            shiftKey: false,
                            ctrlKey: false,
                        };
                        macChromeKeyboardEvent = {
                            ...keyboardEvent,
                            metaKey: true,
                            shiftKey: false,
                            ctrlKey: false,
                            inputType: 'deleteSoftLineBackward',
                        };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('deleteHardLineBackward (ubuntu chrome)', async () => {
                        triggerEvent(editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            ctrlKey: true,
                            shiftKey: true,
                        });
                        triggerEvent(editable, 'beforeInput', {
                            inputType: 'deleteHardLineBackward',
                        });
                        p.removeChild(text);
                        p.removeChild(b);
                        text2.textContent = ', c';
                        setRange(text2, 0, text2, 0);
                        triggerEvent(editable, 'input', { inputType: 'deleteHardLineBackward' });
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
                    it('deleteHardLineBackward (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 2 },
                                    anchor: { id: 'element-0', index: 2, offset: 2 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 0, parentId: 'element-0' }],
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
                    it('deleteHardLineBackward (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 2 },
                                    anchor: { id: 'element-0', index: 2, offset: 2 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Meta', code: 'MetaLeft', metaKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    metaKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteHardLineBackward',
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 0, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ', c',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                { type: 'input', data: null, inputType: 'deleteHardLineBackward' },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 0 },
                                    anchor: { id: 'element-0', index: 0, offset: 0 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Meta', code: 'MetaLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text, b, text2]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('deleteSoftLineBackward (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 2 },
                                    anchor: { id: 'element-0', index: 2, offset: 2 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Meta', code: 'MetaLeft', metaKey: true }],
                            [
                                {
                                    type: 'keydown',
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    metaKey: true,
                                },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteSoftLineBackward',
                                },
                                { type: 'input', data: null, inputType: 'deleteSoftLineBackward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 0, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: ', c',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 1, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: ', c',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                            ],
                            [{ type: 'keyup', key: 'Meta', code: 'MetaLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macChromeKeyboardEvent],
                                mutatedElements: new Set([text, b, text2]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    // impossible to delete a whole line backward on virtual devices
                });
                it('backspace (Edge)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 5, text, 5);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(editable, 'keypress', { key: 'Backspace', code: 'Backspace' });
                    text.textContent = 'hell';
                    triggerEvent(editable, 'input', {});
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

            describe('delete', () => {
                describe('deleteContentForward with delete', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.hello;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
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
                        triggerEvent(editable, 'keydown', { key: 'Delete', code: 'Delete' });
                        triggerEvent(editable, 'keypress', { key: 'Delete', code: 'Delete' });
                        triggerEvent(editable, 'beforeinput', {
                            inputType: 'deleteContentForward',
                        });
                        text.textContent = 'hell';
                        triggerEvent(editable, 'input', { inputType: 'deleteContentForward' });
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
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete' },
                                { type: 'input' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
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
                    it('should deleteContentForward with delete (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentForward',
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                { type: 'input', data: null, inputType: 'deleteContentForward' },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete' }],
                            [{ type: 'keyup', key: 'Meta', code: 'MetaLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('should deleteContentForward with delete (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 4 },
                                    anchor: { id: 'element-0', index: 0, offset: 4 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete' },
                                {
                                    type: 'beforeinput',
                                    data: null,
                                    inputType: 'deleteContentForward',
                                },
                                { type: 'input', data: null, inputType: 'deleteContentForward' },
                                {
                                    type: 'mutation',
                                    textContent: 'hell',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    // todo: ask chm: how to trigger delete with SwiftKey?
                    it.skip('should deleteContentForward with delete (SwiftKey)', async () => {
                        const p = document.createElement('p');
                        const text = document.createTextNode('hello');
                        editable.innerHTML = '';
                        editable.appendChild(p);
                        p.appendChild(text);
                        setRange(text, 5, text, 5);

                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'keypress', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'beforeinput', {
                            inputType: 'deleteContentForward',
                        });
                        text.textContent = 'hell';
                        triggerEvent(editable, 'input', { inputType: 'deleteContentForward' });
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
                // describe.only('delete space+word in the middle of a sentence', () => {
                describe('delete word in the middle of a sentence', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text2: ChildNode;
                    let text3: ChildNode;
                    let i: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.abcg;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');

                        text2 = p.childNodes[2];
                        i = p.childNodes[3];
                        text3 = p.childNodes[4];
                        // setRange(text2, 2, text2, 2);

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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('delete word in the middle of a sentence (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 4 },
                                    anchor: { id: 'element-0', index: 2, offset: 4 },
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
                                { type: 'beforeinput', data: null, inputType: 'deleteWordForward' },
                                { type: 'input', data: null, inputType: 'deleteWordForward' },
                                {
                                    type: 'mutation',
                                    textContent: ' b, ',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b,  g',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' g',
                                    targetParentId: 'element-0',
                                    targetIndex: 4,
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete', ctrlKey: true }],
                            [{ type: 'keyup', key: 'Control', code: 'ControlLeft' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('delete word in the middle of a sentence (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 4 },
                                    anchor: { id: 'element-0', index: 2, offset: 4 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b,  g',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'element-0' }],
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
                    it('delete word in the middle of a sentence (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 4 },
                                    anchor: { id: 'element-0', index: 2, offset: 4 },
                                },
                            ],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete', altKey: true },
                                { type: 'beforeinput', data: null, inputType: 'deleteWordForward' },
                                { type: 'input', data: null, inputType: 'deleteWordForward' },
                                {
                                    type: 'mutation',
                                    textContent: ' b, ',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b,  g',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' g',
                                    targetParentId: 'element-0',
                                    targetIndex: 4,
                                },
                                {
                                    type: 'mutation',
                                    textContent: ' g',
                                    targetParentId: 'element-0',
                                    targetIndex: 4,
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                            [
                                { type: 'keyup', key: 'Alt', code: 'AltLeft' },
                                { type: 'keyup', key: 'Meta', code: 'MetaLeft' },
                            ],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('delete word in the middle of a sentence (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 2, offset: 4 },
                                    anchor: { id: 'element-0', index: 2, offset: 4 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Meta', code: 'MetaLeft' }],
                            [{ type: 'keydown', key: 'Alt', code: 'AltLeft', altKey: true }],
                            [
                                { type: 'keydown', key: 'Delete', code: 'Delete', altKey: true },
                                { type: 'beforeinput', data: null, inputType: 'deleteWordForward' },
                                { type: 'input', data: null, inputType: 'deleteWordForward' },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: ' b, ',
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'a test b,  g',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: ' g',
                                    targetParentId: 'element-0',
                                    targetIndex: 4,
                                },
                            ],
                            [{ type: 'keyup', key: 'Delete', code: 'Delete', altKey: true }],
                            [{ type: 'keyup', key: 'Alt', code: 'AltLeft' }],
                        ]);
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macKeyboardEvent],
                                mutatedElements: new Set([text2, i, text3]),
                            },
                        ];
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                });
                describe('delete whole line forward', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let macKeyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text2: ChildNode;
                    let text3: ChildNode;
                    let i: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.abcg;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');

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
                        macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        firefoxKeyboardEvent = { ...keyboardEvent };
                        // todo: discuss DMO: do we really want to remove inputType?
                        delete firefoxKeyboardEvent.inputType;
                    });
                    it('delete whole line forward (ubuntu chrome)', async () => {
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', {
                            key: 'Delete',
                            code: 'Delete',
                            ctrlKey: true,
                            shiftKey: true,
                        });
                        triggerEvent(editable, 'beforeInput', {
                            inputType: 'deleteHardLineForward',
                        });
                        text2.textContent = ' b';
                        p.removeChild(i);
                        p.removeChild(text3);
                        setRange(text2, 2, text2, 2);
                        triggerEvent(editable, 'input', { inputType: 'deleteHardLineForward' });
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
                                    focus: { id: 'element-0', index: 2, offset: 2 },
                                    anchor: { id: 'element-0', index: 2, offset: 2 },
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
                                    targetParentId: 'element-0',
                                    targetIndex: 2,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 3, parentId: 'element-0' }],
                                },
                                {
                                    type: 'mutation',
                                    textContent: '',
                                    targetParentId: 'element-0',
                                    targetIndex: 4,
                                },
                                {
                                    type: 'mutation',
                                    textContent: 'a test b',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 4, parentId: 'element-0' }],
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
                    // impossible to delete the whole line forward in mac
                });
                describe('delete whole line forward and do nothing', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text3: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.abcg;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');

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
                                    focus: { id: 'element-0', index: 4, offset: 2 },
                                    anchor: { id: 'element-0', index: 4, offset: 2 },
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
                                    focus: { id: 'element-0', index: 4, offset: 2 },
                                    anchor: { id: 'element-0', index: 4, offset: 2 },
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
                    // impossible to delete the whole line forward in mac
                });
            });

            describe('enter', () => {
                describe('enter in the middle of the word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        editable.innerHTML = testContentNormalizer.hello;
                        resetElementsIds(editable);
                        p = document.getElementById('element-0');
                        text = p.childNodes[0];
                        setRange(text, 4, text, 4);
                        await nextTick();
                        eventBatchs = [];

                        keyboardEvent = {
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
                        // firefoxKeyboardEvent = { ...keyboardEvent };
                        // // todo: discuss DMO: do we really want to remove inputType?
                        // delete firefoxKeyboardEvent.inputType;
                        // // virtual keyboards does not provide code
                        // virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });

                    it.only('enter in the middle of the word (ubuntu chrome)', async () => {
                        // editable.innerHTML = '<div>abcd</div>';
                        // const p = editable.firstChild;
                        // const text = p.firstChild;
                        // setRange(text, 2, text, 2);
                        // await nextTick();
                        // eventBatchs = [];
                        // triggerEvent(root, 'keydown', { key: 'Enter', code: 'Enter' });
                        // triggerEvent(root, 'beforeInput', { inputType: 'insertParagraph' });

                        // const newText = document.createTextNode('ab');
                        // p.insertBefore(newText, text);
                        // text.textContent = 'cd';
                        // const newP = document.createElement('p');
                        // root.appendChild(newP);
                        // newP.appendChild(text);
                        // setRange(text, 0, text, 0);

                        // triggerEvent(root, 'input', { inputType: 'insertParagraph' });
                        // await nextTick();
                        // await nextTick();
                        const addedNodes = await triggerEvents([
                            [
                                {
                                    type: 'selection',
                                    focus: { id: 'element-0', index: 0, offset: 3 },
                                    anchor: { id: 'element-0', index: 0, offset: 3 },
                                },
                            ],
                            [
                                { type: 'keydown', key: 'Enter', code: 'Enter' },
                                { type: 'keypress', key: 'Enter', code: 'Enter' },
                                { type: 'beforeinput', data: null, inputType: 'insertParagraph' },
                                { type: 'input', data: null, inputType: 'insertParagraph' },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'hel',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    addedNodes: [
                                        {
                                            parentId: 'element-0',
                                            nodeType: 3,
                                            nextSiblingIndex: 0,
                                            nodeValue: 'hel',
                                        },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'characterData',
                                    textContent: 'lo',
                                    targetParentId: 'element-0',
                                    targetIndex: 0,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'hello',
                                    targetParentId: '',
                                    targetIndex: 11,
                                    addedNodes: [
                                        {
                                            parentId: 'editable',
                                            nodeType: 1,
                                            previousSiblingIndex: 0,
                                            nodeValue: '<p id="element-1">lo</p>',
                                        },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'hel',
                                    targetParentId: 'editable',
                                    targetIndex: 0,
                                    removedNodes: [{ index: 0, parentId: 'element-1' }],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'childList',
                                    textContent: 'lo',
                                    targetParentId: 'editable',
                                    targetIndex: 1,
                                    addedNodes: [
                                        { parentId: 'element-1', nodeType: 3, nodeValue: 'lo' },
                                    ],
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'attributes',
                                    textContent: 'lo',
                                    targetParentId: 'editable',
                                    targetIndex: 1,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'attributes',
                                    textContent: 'lo',
                                    targetParentId: 'editable',
                                    targetIndex: 1,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'attributes',
                                    textContent: 'lo',
                                    targetParentId: 'editable',
                                    targetIndex: 1,
                                },
                                {
                                    type: 'mutation',
                                    mutationType: 'attributes',
                                    textContent: 'lo',
                                    targetParentId: 'editable',
                                    targetIndex: 1,
                                },
                                {
                                    type: 'selection',
                                    focus: { id: 'element-1', index: 0, offset: 0 },
                                    anchor: { id: 'element-1', index: 0, offset: 0 },
                                },
                            ],
                            [{ type: 'keyup', key: 'Enter', code: 'Enter' }],
                        ]);
                        console.log('addedNodes:', addedNodes);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                // mutatedElements: new Set([newText, text, newP]),
                                mutatedElements: new Set([...addedNodes]),
                            },
                        ];
                        debugger;
                        expect(eventBatchs).to.deep.equal(batchEvents);
                    });
                    it('enter in the middle of the word (SwiftKey)', async () => {
                        editable.innerHTML = '<div>abcd</div>';
                        const p = editable.firstChild;
                        const text = p.firstChild;
                        setRange(text, 2, text, 2);
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'beforeInput', { inputType: 'insertParagraph' });

                        const newText = document.createTextNode('ab');
                        p.insertBefore(newText, text);
                        text.textContent = 'cd';
                        const newP = document.createElement('p');
                        editable.appendChild(newP);
                        newP.appendChild(text);
                        setRange(text, 0, text, 0);

                        triggerEvent(editable, 'input', { inputType: 'insertParagraph' });
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
                });
                describe('enter before a word', () => {
                    it('enter before a word (Gboard)', async () => {
                        editable.innerHTML = '<div>abc def</div>';
                        const p = editable.firstChild;
                        const text = p.firstChild as Text;
                        setRange(text, 4, text, 4);
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'compositionend', { data: 'def' });
                        await nextTick();
                        triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'beforeInput', { inputType: 'insertParagraph' });

                        text.textContent = 'abc def';
                        const newText = document.createTextNode('abc\u00A0');
                        p.insertBefore(newText, text);
                        text.textContent = 'def';
                        const newP = document.createElement('p');
                        editable.appendChild(newP);
                        newP.appendChild(text);
                        setRange(text, 0, text, 0);

                        triggerEvent(editable, 'input', { inputType: 'insertParagraph' });
                        triggerEvent(editable, 'compositionstart', { data: '' });
                        triggerEvent(editable, 'compositionupdate', { data: 'def' });

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
                });
                describe('enter after a word', () => {
                    it('enter after a word (Gboard)', async () => {
                        editable.innerHTML = '<div>abc def</div>';
                        const p = editable.firstChild;
                        const text = p.firstChild as Text;
                        setRange(text, 3, text, 3);
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'compositionend', { data: 'abc' });
                        await nextTick();
                        triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(editable, 'beforeInput', { inputType: 'insertParagraph' });

                        const newText = document.createTextNode('abc');
                        p.insertBefore(newText, text);
                        text.textContent = ' def';
                        const newP = document.createElement('p');
                        editable.appendChild(newP);
                        newP.appendChild(text);
                        text.textContent = 'def';
                        text.textContent = '\u00A0def';

                        setRange(text, 0, text, 0);

                        triggerEvent(editable, 'input', { inputType: 'insertParagraph' });

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
                });
                describe('shift + enter in the middle of a word ', () => {
                    it('shift + enter in the middle of a word (ubuntu chrome)', async () => {
                        editable.innerHTML = '<div>abcd</div>';
                        const p = editable.firstChild;
                        const text = p.firstChild;
                        setRange(text, 2, text, 2);
                        await nextTick();
                        eventBatchs = [];
                        triggerEvent(editable, 'keydown', { key: 'Enter', code: 'Enter' });
                        triggerEvent(editable, 'beforeInput', { inputType: 'insertLineBreak' });

                        const newText = document.createTextNode('ab');
                        p.insertBefore(newText, text);
                        text.textContent = 'cd';
                        const br = document.createElement('br');
                        p.insertBefore(br, text);
                        setRange(text, 0, text, 0);

                        triggerEvent(editable, 'input', { inputType: 'insertLineBreak' });
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
                // todo: shift+ctrl+enter
            });

            describe('arrow', () => {
                it('arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    document.getSelection().removeAllRanges();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
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
                                    startContainer: editable,
                                    startOffset: 0,
                                    endContainer: editable,
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', {
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 3, text, 3);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', {
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
                    editable.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(
                        editable.childNodes[1].firstChild,
                        1,
                        editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(editable, 'keydown', { key: 'a', code: 'KeyQ', ctrlKey: true });
                    setRange(editable.firstChild.firstChild, 0, editable.lastChild.lastChild, 1);
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
                                    offsetNode: editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: editable.lastChild.lastChild,
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
                    editable.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    setRange(
                        editable.childNodes[1].firstChild,
                        1,
                        editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(editable, 'keydown', { key: 'a', code: 'KeyQ', ctrlKey: true });
                    setRange(
                        editable.firstChild.firstChild,
                        0,
                        editable.lastChild.lastChild.previousSibling,
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
                                    offsetNode: editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: editable.lastChild.lastChild.previousSibling,
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
                    editable.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(
                        editable.childNodes[1].firstChild,
                        1,
                        editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', {
                        key: 'Meta',
                        code: 'MetaLeft',
                        metaKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(editable, 'keydown', { key: 'a', code: 'KeyQ', metaKey: true });
                    triggerEvent(editable, 'keypress', { key: 'a', code: 'KeyQ', metaKey: true });
                    await nextTick();
                    await nextTick();
                    setRange(editable.firstChild.firstChild, 0, editable.lastChild.lastChild, 1);
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
                                    offsetNode: editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: editable.lastChild.lastChild,
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
                    editable.innerHTML = '<div>abc<br/>abc<br/>abc</div>';
                    const div = editable.firstChild;
                    const text1 = div.childNodes[0];
                    const br1 = div.childNodes[1];
                    const text2 = div.childNodes[2];
                    const br2 = div.childNodes[3];
                    const text3 = div.childNodes[4];
                    setRange(text1, 1, text3, 2);
                    await nextTick();

                    eventBatchs = [];

                    triggerEvent(editable, 'keydown', { key: 'x', code: 'KeyX', ctrlKey: true });
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
                    editable.innerHTML = '<div>abc</div>';
                    const p = editable.firstChild;
                    const text = p.firstChild;
                    setRange(text, 1, text, 1);
                    await nextTick();

                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'v', code: 'KeyV', ctrlKey: true });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'z', code: 'KeyW', ctrlKey: true });
                    triggerEvent(editable, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(editable, 'input', { inputType: 'historyUndo' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 1, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'keydown', { key: 'b', code: 'KeyB', ctrlKey: true });
                    triggerEvent(editable, 'beforeinput', { inputType: 'formatBold' });
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
                    triggerEvent(editable, 'input', { inputType: 'formatBold' });
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
                    editable.innerHTML = '<div>abc</div>';
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
                    editable.innerHTML = '<div style="position: absolute; left: 250px;">abc</div>';
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 5,
                        clientY: 5,
                    });
                    setRange(other.firstChild, 1, other.firstChild, 1);
                    triggerEvent(editable, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 5,
                        clientY: 5,
                    });
                    triggerEvent(editable, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 5,
                        clientY: 5,
                    });
                    await nextTick();
                    await nextTick();
                    const pointerEvent: NormalizedPointerEvent = {
                        type: 'pointer',
                        caretPosition: {
                            offsetNode: editable,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: editable,
                                    startOffset: 0,
                                    endContainer: editable,
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
                    editable.innerHTML = '<div>abc</div>';
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
                    editable.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = 'abc<i contentEditable="false">test</i>def';
                    const text = editable.firstChild;
                    const i = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc def</div>';
                    const p = editable.firstChild;
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
                    triggerEvent(editable, 'compositionstart', { data: '' });
                    triggerEvent(editable, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    triggerEvent(editable, 'compositionupdate', { data: 'def' });
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
                    editable.innerHTML = '<div>abc def</div>';
                    const p = editable.firstChild;
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
                    triggerEvent(editable, 'compositionupdate', { data: 'def' });
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
                    editable.innerHTML = '<div>abc</div>';
                    const p = editable.firstChild;
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
                    editable.innerHTML = '<div>ab<input/>cd</div>';
                    const p = editable.firstChild;
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 7, text, 7);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'compositionupdate', { data: 'hillo' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    text.textContent = 'a hello b';
                    triggerEvent(editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'hello' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionend', { data: 'hello' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 18, text, 18);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', {
                        data: 'raths',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'And the mome outgrabe.';
                    text.textContent = 'And the mome raths outgrabe.';
                    triggerEvent(editable, 'input', {
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
                    editable.innerHTML = '<div>.<b>chr</b>is .</div>';
                    const div = editable.childNodes[0];
                    const b = div.childNodes[1];
                    const firstText = div.firstChild;
                    const textB = b.firstChild;
                    const text = div.childNodes[2];
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'compositionupdate', { data: 'chris' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'Christophe' });

                    div.removeChild(firstText); // remove first text node
                    b.removeChild(textB); // remove text in b
                    div.removeChild(b); // remove b
                    const newText = document.createTextNode('.');
                    div.insertBefore(newText, text); // re-create first text node
                    const newB = document.createElement('b');
                    newB.textContent = 'Christophe';
                    div.insertBefore(newB, text); // re-create b
                    text.textContent = '\u00A0.'; // update text node

                    triggerEvent(editable, 'input', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionend', { data: 'Christophe' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 9, text, 9);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'compositionupdate', { data: '' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionstart', {});
                    triggerEvent(editable, 'beforeInput', {
                        data: 'ha',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'ha' });
                    text.textContent = 'Ha ha ha haha ha';
                    triggerEvent(editable, 'input', {
                        data: 'ha',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionend', { data: 'ha' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'Ha ha ha ha ha ha';
                    triggerEvent(editable, 'input', { data: ' ', inputType: 'insertText' });
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
                    editable.innerHTML = '<div>abc def</div>';
                    const p = editable.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionend', { data: 'aXc' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(editable, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'c def';
                    // in real googleKeyboard realase the mutation just after input without
                    // timeout, in this test it's impositble to do that. But the implementation
                    // use a setTimeout, the mutation stack is the same.
                    triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(editable, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(editable, 'beforeInput', { inputType: 'insertText', data: 'aXc' });
                    text.textContent = 'aXc def';
                    text.textContent = 'aXc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(editable, 'input', { inputType: 'insertText', data: 'aXc' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
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
                    editable.innerHTML = '<div>abc def</div>';
                    const p = editable.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionend', { data: 'abc' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(editable, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'c def';
                    triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(editable, 'beforeInput', { inputType: 'deleteContentBackward' });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(editable, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(editable, 'beforeInput', { inputType: 'insertText', data: 'abc' });
                    text.textContent = 'abc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(editable, 'input', { inputType: 'insertText', data: 'abc' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified', code: '' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(br);
                    setRange(p, 0, p, 0);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'compositionstart', { data: '' });
                    triggerEvent(editable, 'compositionupdate', { data: '' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionstart', { data: '' });
                    triggerEvent(editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'compositionupdate', { data: 'hello' });
                    const text = document.createTextNode('');
                    p.insertBefore(text, br);
                    p.removeChild(br);
                    text.textContent = 'hello';
                    triggerEvent(editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(editable, 'compositionend', { data: 'hello' });
                    triggerEvent(editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(editable, 'beforeInput', { data: ' ', inputType: 'insertText' });
                    text.textContent = 'hello ';
                    text.textContent = 'hello\u00A0';
                    setRange(text, 6, text, 6);
                    triggerEvent(editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', { inputType: 'insertReplacementText' });
                    text.textContent = 'a brill b';
                    triggerEvent(editable, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(i);
                    i.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', { inputType: 'insertReplacementText' });
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
                    triggerEvent(editable, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(editable, 'keyup', { key: 'Unidentified' });
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
                    editable.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'slithy toes';
                    triggerEvent(editable, 'input', {
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
                    editable.innerHTML = '<p><i>’Twas brillig, and the slithy toves</i><br/></p>';
                    const p = editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild as Text;
                    setRange(text, 6, text, 13);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', {
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

                    triggerEvent(editable, 'input', {
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
                    editable.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });

                    text.textContent = 'slithy ';
                    text.textContent = 'slithy ';
                    const text2 = document.createTextNode('toes');
                    editable.appendChild(text2);
                    const br = document.createElement('br');
                    editable.insertBefore(br, text2);
                    text2.textContent = '';
                    editable.removeChild(text2);
                    editable.removeChild(br);
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

                    triggerEvent(editable, 'input', {
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(editable, 'contextmenu', {
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
                    triggerEvent(editable, 'input', {});
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
                    editable.innerHTML = 'a<br/>b';
                    const text = editable.firstChild;
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 8,
                        clientY: 10,
                    });
                    setRange(text, 1, text, 1);
                    triggerEvent(editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 8,
                        clientY: 10,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(editable, 0, other.firstChild, 3);
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
                                    startContainer: editable,
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
                    editable.innerHTML = '<div><br/><br/>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = editable.firstChild;
                    const p2 = editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = editable.childNodes[2];
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
                    editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = editable.childNodes[1] as HTMLElement;
                    const text2 = p2.firstChild;
                    const p3 = editable.childNodes[2];
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
                    editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = editable.childNodes[2];
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
                    editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = editable.lastChild;
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
                    editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = editable.childNodes[2];
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
                    editable.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    // todo: verify and changes the names for all the tests
                    const p = editable.firstChild;
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
                    triggerEvent(editable.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(editable.lastChild, 'mouseup', {
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
                    editable.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    const p = editable.firstChild;
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
                    triggerEvent(editable.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(editable.lastChild, 'mouseup', {
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
                    editable.innerHTML = '<div>abc</div>';
                    const p = editable.firstChild;
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML =
                        '<div>a<a href="https://www.odoo.com"></a>c</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const a = p.childNodes[1];
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>a<svg></svg>c</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const svg = editable.querySelector('svg');
                    const p2 = editable.childNodes[1];

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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = editable.firstChild;
                    const p2 = editable.childNodes[1];
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
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
                    triggerEvent(editable, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(editable, 'input', { inputType: 'historyUndo' });
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
                    editable.innerHTML = '';
                    editable.appendChild(p);
                    p.appendChild(text);

                    await nextTick();
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
                    setRange(text, 1, text, 4);
                    triggerEvent(p, 'click', { button: 2, detail: 0 });
                    triggerEvent(p, 'mouseup', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();

                    eventBatchs = [];
                    triggerEvent(editable, 'beforeinput', { inputType: 'formatBold' });
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
                    triggerEvent(editable, 'input', { inputType: 'formatBold' });
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
