/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { Direction } from '../src/VRange';
import { EventNormalizer, EventBatch } from '../src/EventNormalizer';

type TriggerNativeEventsOption =
    | MouseEventInit
    | KeyboardEventInit
    | CompositionEventInit
    | InputEventInit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | CustomEventInit<any>
    | EventInit
    | DragEventInit
    | ClipboardEventInit;

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
        mouse: ['click', 'mouse', 'pointer', 'contextmenu', 'select', 'wheel'],
        composition: ['composition'],
        input: ['input'],
        keyboard: ['key'],
        drag: ['dragstart', 'dragend', 'drop'],
        paste: ['paste'],
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
        case 'mouse':
        case 'contextmenu':
            ev = new MouseEvent(eventName, options);
            break;
        case 'keyboard':
            ev = new KeyboardEvent(eventName, options);
            break;
        case 'composition':
            ev = new CompositionEvent(eventName, options);
            break;
        case 'drag':
            ev = new DragEvent(eventName, options);
            break;
        case 'paste':
            ev = new ClipboardEvent(eventName, options);
            break;
        case 'input':
            ev = new InputEvent(eventName, options);
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

describe('utils', () => {
    describe('EventNormalizer', () => {
        let container: HTMLElement;
        let root: HTMLElement;
        let other: HTMLElement;
        let eventBatchs = [];
        let normalizer: EventNormalizer;
        function callback(res: EventBatch): void {
            eventBatchs.push(res);
        }
        function callbackBefore(done: Function): void {
            container = document.createElement('container');
            container.style.fontSize = '10px';
            container.style.display = 'block';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            root = document.createElement('div');
            root.style.display = 'block';
            container.appendChild(root);
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

        describe('keyboard', () => {
            describe('insert', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('insert char (chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('insert space (chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 5, text, 5);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('insert space (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 5, text, 5);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('multi keypress (chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
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
                                            origin: 'EventNormalizer',
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
                                            origin: 'EventNormalizer',
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
                                            direction: 'backward',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
            });

            describe('completion/correction', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('accent (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('accent (ubuntu firefox)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('accent (mac safari)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: '^' });
                    triggerEvent(root, 'beforeInput', {
                        data: '^',
                        inputType: 'insertCompositionText',
                    });
                    text.textContent = 'hell^';
                    triggerEvent(root, 'input', { data: '^', inputType: 'insertCompositionText' });
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
                    triggerEvent(root, 'input', { data: 'ô', inputType: 'insertFromComposition' });
                    triggerEvent(root, 'compositionend', { data: 'ô' });
                    triggerEvent(root, 'keydown', { key: 'ô', code: 'KeyO' });
                    setRange(text, 5, text, 5);
                    await nextTick();
                    triggerEvent(root, 'keyup', { key: 'o', code: 'KeyO' });
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: '',
                                    to: '^',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 4,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: '^',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                        {
                            events: [
                                {
                                    from: '^',
                                    to: 'ô',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 5,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'ô',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('accent (mac chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: '^' });
                    triggerEvent(root, 'beforeInput', {
                        data: '^',
                        inputType: 'insertCompositionText',
                    });
                    text.textContent = 'hell^';
                    triggerEvent(root, 'input', { data: '^', inputType: 'insertCompositionText' });
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
                    triggerEvent(root, 'input', { data: 'ô', inputType: 'insertCompositionText' });
                    triggerEvent(root, 'compositionend', { data: 'ô' });
                    setRange(text, 5, text, 5);
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: '',
                                    to: '^',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 4,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: '^',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                        {
                            events: [
                                {
                                    from: '^',
                                    to: 'ô',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 5,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'ô',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('accent (mac firefox)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                    triggerEvent(root, 'compositionstart', {});
                    triggerEvent(root, 'compositionupdate', { data: '^' });
                    text.textContent = 'hell^';
                    triggerEvent(root, 'input', { data: '^', inputType: 'insertCompositionText' });
                    setRange(text, 5, text, 5);
                    await nextTick();
                    await nextTick();

                    triggerEvent(root, 'keydown', { key: 'o', code: 'KeyO' });
                    triggerEvent(root, 'compositionupdate', { data: 'ô' });
                    triggerEvent(root, 'compositionend', { data: 'ô' });
                    text.textContent = 'hellô';
                    triggerEvent(root, 'input', { data: 'ô', inputType: 'insertCompositionText' });
                    setRange(text, 5, text, 5);
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: '',
                                    to: '^',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 4,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: '^',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                        {
                            events: [
                                {
                                    from: '^',
                                    to: 'ô',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 4,
                                                endContainer: text,
                                                endOffset: 5,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'ô',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('accent (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction (SwiftKey)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'hillo',
                                    to: 'hello',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 2,
                                                endContainer: text,
                                                endOffset: 7,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'hello',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: '\n',
                                    to: 'hello ',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: br,
                                                startOffset: 0,
                                                endContainer: br,
                                                endOffset: 1,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'hello',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            text: ' ',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, br]),
                        },
                    ]);
                });
                it('should auto-correction a word (safari)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'rates',
                                    to: 'raths',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 13,
                                                endContainer: text,
                                                endOffset: 18,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'raths',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('add space (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'Unidentified',
                                    inputType: 'insertCompositionText',
                                    code: undefined,
                                    altKey: false,
                                    ctrlKey: false,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            text: ' ',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('add space with auto-correction (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a hillo');
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'hillo',
                                    to: 'hello ',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 2,
                                                endContainer: text,
                                                endOffset: 7,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'hello',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            text: ' ',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction with bold (SwiftKey)', async () => {
                    root.innerHTML = '<div>.<b>chr</b>is .</div>';
                    const p = root.childNodes[0];
                    const b = p.childNodes[1];
                    const firstText = p.firstChild;
                    const textB = b.firstChild;
                    const text = p.childNodes[2];
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

                    p.removeChild(firstText); // remove first text node
                    b.removeChild(textB); // remove text in b
                    p.removeChild(b); // remove b
                    const newText = document.createTextNode('.');
                    p.insertBefore(newText, text); // re-create first text node
                    const newB = document.createElement('b');
                    newB.textContent = 'Christophe';
                    p.insertBefore(newB, text); // re-create b
                    text.textContent = '\u00A0.'; // update text node

                    triggerEvent(root, 'input', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(root, 'compositionend', { data: 'Christophe' });
                    setRange(text, 1, text, 1);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'chris ',
                                    to: 'Christophe ',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: textB,
                                                startOffset: 0,
                                                endContainer: text,
                                                endOffset: 2,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'Christophe',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 2,
                                                endContainer: text,
                                                endOffset: 3,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: ' ',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([firstText, textB, b, newText, newB, text]),
                        },
                    ]);
                });
                it('completion with repeat (SwiftKey)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: '',
                                    to: 'ha ',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 9,
                                                endContainer: text,
                                                endOffset: 9,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'ha',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            text: ' ',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction (googleKeyboard)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'abc',
                                    to: 'aXc',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 0,
                                                endContainer: text,
                                                endOffset: 3,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'aXc',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction by same value (googleKeyboard)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'abc',
                                    to: 'abc',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 0,
                                                endContainer: text,
                                                endOffset: 3,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'abc',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });

                // unwant preventDefault

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'ô',
                                    code: 'KeyO',
                                    altKey: false,
                                    ctrlKey: false,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: true,
                                    actions: [],
                                },
                            ],
                            mutatedElements: new Set(),
                        },
                    ]);
                });
            });

            describe('delete', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('backspace = deleteContentBackward (chrome)', async () => {
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
                    triggerEvent(root, 'beforeinput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'hell';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 4, text, 4);
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
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
                                            direction: 'backward',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('delete = deleteContentForward (chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', { key: 'Delete', code: 'Delete' });
                    triggerEvent(root, 'keypress', { key: 'Delete', code: 'Delete' });
                    triggerEvent(root, 'beforeinput', { inputType: 'deleteContentForward' });
                    text.textContent = 'hell';
                    triggerEvent(root, 'input', { inputType: 'deleteContentForward' });
                    setRange(text, 4, text, 4);
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'forward',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('backspace = deleteContentBackward (SwiftKey)', async () => {
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
                    triggerEvent(root, 'beforeinput', { inputType: 'deleteContentBackward' });
                    text.textContent = 'hell';
                    triggerEvent(root, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 4, text, 4);
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
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
                                            direction: 'backward',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('delete = deleteContentForward (SwiftKey)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'forward',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('backspace ending word (chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello toto');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 10, text, 10);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'backward',
                                            text: 'toto',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('backspace word (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a test b');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 6, text, 6);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'backward',
                                            text: 'test',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('backspace styled word (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>test</b>, b';
                    const text = p.lastChild;
                    const b = p.childNodes[1];
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 0, text, 0);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'Backspace',
                        code: 'Backspace',
                        ctrlKey: true,
                    });
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteWordBackward' });
                    p.removeChild(b);
                    setRange(text, 0, text, 0);
                    triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'backward',
                                            text: 'test',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([b]),
                        },
                    ]);
                });
                it('backspace multi-styled word (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>t<u>e</u>s</b>t b';
                    const text = p.lastChild;
                    const b = p.childNodes[1];
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 1, text, 1);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'Backspace',
                        code: 'Backspace',
                        ctrlKey: true,
                    });
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteWordBackward' });
                    p.removeChild(b);
                    text.textContent = ' b';
                    text.textContent = '\u00A0b';
                    setRange(text, 0, text, 0);
                    triggerEvent(root, 'input', { inputType: 'deleteWordBackward' });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'backward',
                                            text: 'test',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([b, text]),
                        },
                    ]);
                });
                it('backspace whole content (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>test</b> b, c';
                    const text = p.firstChild;
                    const text2 = p.lastChild;
                    const b = p.childNodes[1];
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text2);
                    setRange(text2, 2, text2, 2);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'backward',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 0,
                                                endContainer: text2,
                                                endOffset: 2,
                                                direction: Direction.BACKWARD,
                                            },
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, b, text2]),
                        },
                    ]);
                });
                it('delete word (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>test</b> b, c<i>test</i> g';
                    const text2 = p.childNodes[2];
                    const i = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    root.innerHTML = '';
                    root.appendChild(p);
                    setRange(text2, 3, text2, 3);

                    await nextTick();
                    eventBatchs = [];
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'forward',
                                            text: 'ctest',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text2, i, text3]),
                        },
                    ]);
                });
                it('delete whole content (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>test</b> b, c<i>test</i> g';
                    const text2 = p.childNodes[2];
                    const i = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    root.innerHTML = '';
                    root.appendChild(p);

                    setRange(text2, 2, text2, 2);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            direction: 'forward',
                                            domRange: {
                                                startContainer: text2,
                                                startOffset: 2,
                                                endContainer: text3,
                                                endOffset: 2,
                                                direction: Direction.FORWARD,
                                            },
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text2, i, text3]),
                        },
                    ]);
                });
                it('delete whole at the end do nothing (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    p.innerHTML = 'a <b>test</b> b, c<i>test</i> g';
                    const text3 = p.childNodes[4];
                    root.innerHTML = '';
                    root.appendChild(p);
                    setRange(text3, 2, text3, 2);

                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(root, 'keydown', {
                        key: 'Delete',
                        code: 'Delete',
                        ctrlKey: true,
                        shiftKey: true,
                    });
                    triggerEvent(root, 'beforeInput', { inputType: 'deleteHardLineForward' });
                    text3.textContent = ' g';
                    setRange(text3, 2, text3, 2);
                    triggerEvent(root, 'input', { inputType: 'deleteHardLineForward' });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    inputType: 'deleteHardLineForward',
                                    key: 'Delete',
                                    code: 'Delete',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: true,
                                    defaultPrevented: false,
                                    actions: [],
                                },
                            ],
                            mutatedElements: new Set([text3]),
                        },
                    ]);
                });
            });

            describe('enter', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ]);
                });
                it('enter before a word (googleKeyboard)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, newText, newP]),
                        },
                    ]);
                });
                it('enter after a word (googleKeyboard)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([newText, text, newP]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([newText, text, br]),
                        },
                    ]);
                });
            });

            describe('arrow', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('select all', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
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
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'Control',
                                    code: 'ControlLeft',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
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
                                            target: {
                                                offsetNode: root.childNodes[1].firstChild,
                                                offset: 1,
                                            },
                                            domRange: {
                                                startContainer: root.firstChild.firstChild,
                                                startOffset: 0,
                                                endContainer:
                                                    root.lastChild.lastChild.previousSibling,
                                                endOffset: 0,
                                                direction: Direction.FORWARD,
                                            },
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'Meta',
                                    code: 'MetaLeft',
                                    altKey: false,
                                    ctrlKey: false,
                                    metaKey: true,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
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
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('cut', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('ctrl + c to cut', async () => {
                    root.innerHTML = '<div>abc<br/>abc<br/>abc</div>';
                    const p = root.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    setRange(text1, 1, text3, 2);
                    await nextTick();

                    eventBatchs = [];

                    triggerEvent(root, 'keydown', { key: 'x', code: 'KeyX', ctrlKey: true });
                    triggerEvent(p, 'beforeinput', { inputType: 'deleteByCut' });
                    triggerEvent(p, 'input', { inputType: 'deleteByCut' });
                    (text1 as Text).textContent = 'ab';
                    p.removeChild(br1);
                    p.removeChild(text2);
                    p.removeChild(br2);
                    (text3 as Text).textContent = 'c';
                    setRange(text3, 0, text3, 0);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'x',
                                    code: 'KeyX',
                                    inputType: 'deleteByCut',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            direction: 'forward',
                                            type: 'deleteContent',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text1, br1, text2, br2, text3]),
                        },
                    ]);
                });
            });

            describe('paste', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    key: 'v',
                                    code: 'KeyV',
                                    inputType: 'insertFromPaste',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            html: '<div>b</div>',
                                            text: 'b',
                                            type: 'insertHtml',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('history', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    inputType: 'historyUndo',
                                    key: 'z',
                                    code: 'KeyW',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [{ type: 'historyUndo', origin: 'EventNormalizer' }],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
            });

            describe('format', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'keyboard',
                                    inputType: 'formatBold',
                                    key: 'b',
                                    code: 'KeyB',
                                    altKey: false,
                                    ctrlKey: true,
                                    metaKey: false,
                                    shiftKey: false,
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            format: 'bold',
                                            type: 'applyFormat',
                                            origin: 'EventNormalizer',
                                            data: null,
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text2, text, text3, span, b]),
                        },
                    ]);
                });
            });
        });
        describe('pointer', () => {
            describe('set range', () => {
                before(callbackBefore);
                after(callbackAfter);

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
                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text2, 1);
                    triggerEvent(p2, 'click', { button: 2, detail: 0, clientX: 5, clientY: 18 });
                    triggerEvent(p2, 'mouseup', { button: 2, detail: 0, clientX: 5, clientY: 18 });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientY: 10,
                    });
                    setRange(text, 3, text, 3);
                    triggerEvent(i, 'click', { button: 2, detail: 0, clientX: 20, clientY: 10 });
                    triggerEvent(i, 'mouseup', { button: 2, detail: 0, clientX: 20, clientY: 10 });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
                it('touchdown setRange (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'touchstart', { detail: 0 });
                    await nextTick();
                    triggerEvent(p, 'touchend', { detail: 0 });
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 1,
                        detail: 1,
                        clientX: 18,
                        clientY: 10,
                    });
                    triggerEvent(p, 'click', { button: 1, detail: 1, clientX: 18, clientY: 10 });
                    setRange(text, 4, text, 4);
                    await nextTick();
                    triggerEvent(root, 'compositionstart', { data: '' });
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
                it('touchdown setRange move inside a word (googleKeyboard)', async () => {
                    root.innerHTML = '<div>abc def</div>';
                    const p = root.firstChild;
                    const text = p.firstChild;
                    setRange(text, 3, text, 3);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'touchstart', { detail: 0 });
                    await nextTick();
                    triggerEvent(p, 'touchend', { detail: 0 });
                    await nextTick();
                    triggerEvent(p, 'mousedown', {
                        button: 1,
                        detail: 1,
                        clientX: 14,
                        clientY: 10,
                    });
                    triggerEvent(p, 'click', { button: 1, detail: 1, clientX: 14, clientY: 10 });
                    setRange(text, 2, text, 2);
                    await nextTick();
                    triggerEvent(root, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text,
                                        offset: 3,
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('completion/correction', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('correction (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'brillig',
                                    to: 'brill',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 2,
                                                endContainer: text,
                                                endOffset: 9,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'brill',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction in i tag (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'brillig',
                                    to: 'brill',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 2,
                                                endContainer: text,
                                                endOffset: 9,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'brill',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, newText, newText2]),
                        },
                    ]);
                });
                it('correction at end (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'toves',
                                    to: 'toes',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 7,
                                                endContainer: text,
                                                endOffset: 12,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'toes',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
                it('correction at middle (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'brillig',
                                    to: 'brill',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 6,
                                                endContainer: text,
                                                endOffset: 13,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'brill',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, text2, text3]),
                        },
                    ]);
                });
                it('correction at end of i tag (ubuntu chrome)', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    from: 'toves',
                                    to: 'toes',
                                    type: 'composition',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'setRange',
                                            origin: 'EventNormalizer',
                                            domRange: {
                                                startContainer: text,
                                                startOffset: 7,
                                                endContainer: text,
                                                endOffset: 12,
                                                direction: 'BACKWARD',
                                            },
                                        },
                                        {
                                            text: 'toes',
                                            type: 'insertText',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text, text2, br, span, text3, i2, i]),
                        },
                    ]);
                });
            });

            describe('select all', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text,
                                        offset: 1,
                                    },
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'selectAll',
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 34,
                    });
                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 5,
                        clientY: 34,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(p1, 0, p3, 1);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text2,
                                        offset: 1,
                                    },
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'selectAll',
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
                it('mouse select all with invisible content (ubuntu chrome)', async () => {
                    root.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = root.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = root.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = root.childNodes[2];
                    await nextTick();
                    triggerEvent(p2, 'mousedown', { button: 2, detail: 1 });
                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    eventBatchs = [];
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text2,
                                        offset: 1,
                                    },
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'selectAll',
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                    triggerEvent(p2, 'touchstart', { button: 2, detail: 1 });
                    triggerEvent(p2, 'contextmenu', {
                        button: 0,
                        detail: 0,
                        clientX: 5,
                        clientY: 18,
                    });
                    setRange(text2, 1, text2, 1);
                    await nextTick();
                    triggerEvent(p2, 'touchend', { button: 2, detail: 0 });
                    triggerEvent(p2, 'contextmenu', {
                        button: 0,
                        detail: 0,
                        clientX: 5,
                        clientY: 18,
                    });
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text2,
                                        offset: 1,
                                    },
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            type: 'selectAll',
                                            target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('cut', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('use mouse cut', async () => {
                    root.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    const p = root.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1, clientX: 6, clientY: 10 });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text3, 2);
                    triggerEvent(root.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 10,
                        clientY: 30,
                    });
                    triggerEvent(root.lastChild, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 10,
                        clientY: 30,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1, clientX: 6, clientY: 20 });
                    triggerEvent(p, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 6,
                        clientY: 20,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(p, 'beforeinput', { inputType: 'deleteByCut' });
                    triggerEvent(p, 'input', { inputType: 'deleteByCut' });
                    (text1 as Text).textContent = 'ab';
                    p.removeChild(br1);
                    p.removeChild(text2);
                    p.removeChild(br2);
                    (text3 as Text).textContent = 'i';
                    setRange(text3, 0, text3, 0);
                    await nextTick();
                    await nextTick();

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'deleteByCut',
                                    target: {
                                        offsetNode: text2,
                                        offset: 1,
                                    },
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            direction: 'forward',
                                            type: 'deleteContent',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text1, br1, text2, br2, text3]),
                        },
                    ]);
                });
            });

            describe('paste', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('paste with context menu', async () => {
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromPaste',
                                    target: {
                                        offsetNode: text,
                                        offset: 1,
                                    },
                                    defaultPrevented: true,
                                    actions: [
                                        {
                                            html: '<div>b</div>',
                                            text: 'b',
                                            type: 'insertHtml',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('drag and drop', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('from self content', async () => {
                    root.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = root.firstChild;
                    const p2 = root.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    eventBatchs = [];
                    triggerEvent(p, 'mousedown', { button: 0, detail: 1, clientX: 5, clientY: 5 });
                    await nextTick();
                    triggerEvent(p.firstChild, 'dragstart', { clientX: 5, clientY: 5 });
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'b');
                    dataTransfer.setData('text/html', '<div>b</div>');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
                                        offsetNode: p2.firstChild,
                                        offset: 1,
                                    },
                                    defaultPrevented: true,
                                    actions: [
                                        {
                                            type: 'deleteContent',
                                            direction: 'forward',
                                            origin: 'EventNormalizer',
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<div>b</div>',
                                            text: 'b',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                    triggerEvent(a, 'dragstart', { clientX: 5, clientY: 5 });
                    await nextTick();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', 'https://www.odoo.com');
                    dataTransfer.setData('text/html', '<a href="https://www.odoo.com"></a>');
                    dataTransfer.setData('text/uri-list', 'https://www.odoo.com');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
                                        offsetNode: p2.firstChild,
                                        offset: 1,
                                    },
                                    defaultPrevented: true,
                                    actions: [
                                        {
                                            type: 'deleteContent',
                                            direction: 'forward',
                                            origin: 'EventNormalizer',
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<a href="https://www.odoo.com"></a>',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 5,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    dataTransfer.setData('text/html', '<svg>unload content</svg>');
                    dataTransfer.setData('text/uri-list', 'svg');
                    const dropEvent = triggerEvent(p2, 'drop', {
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
                                        offsetNode: p2.firstChild,
                                        offset: 1,
                                    },
                                    defaultPrevented: true,
                                    actions: [
                                        {
                                            type: 'deleteContent',
                                            direction: 'forward',
                                            origin: 'EventNormalizer',
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<svg>unload content</svg>',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html:
                                                '<a href="https://www.odoo.com/mylink">https://www.odoo.com/mylink</a>',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertText',
                                            text: 'b',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<div>b</div>',
                                            text: 'b',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<img src="https://www.odoo.com/logo.png">',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html: '<a href="https://www.odoo.com">test</a>',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertHtml',
                                            html:
                                                '<a href="https://www.odoo.com">https://www.odoo.com</a>',
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
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
                        clientX: 5,
                        clientY: 20,
                        dataTransfer: dataTransfer,
                    });
                    await nextTick();
                    triggerEvent(p2, 'dragend', { clientX: 5, clientY: 20 });
                    await nextTick();
                    await nextTick();

                    expect(dropEvent.defaultPrevented).to.equal(true);

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    inputType: 'insertFromDrop',
                                    target: {
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
                                            origin: 'EventNormalizer',
                                        },
                                        {
                                            type: 'insertFiles',
                                            files: files,
                                            origin: 'EventNormalizer',
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([]),
                        },
                    ]);
                });
            });

            describe('history', () => {
                before(callbackBefore);
                after(callbackAfter);

                it('mouse history undo (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    root.innerHTML = '';
                    root.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text,
                                        offset: 1,
                                    },
                                    inputType: 'historyUndo',
                                    defaultPrevented: false,
                                    actions: [{ type: 'historyUndo', origin: 'EventNormalizer' }],
                                },
                            ],
                            mutatedElements: new Set([text]),
                        },
                    ]);
                });
            });

            describe('format', () => {
                before(callbackBefore);
                after(callbackAfter);

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

                    expect(eventBatchs).to.deep.equal([
                        {
                            events: [
                                {
                                    type: 'pointer',
                                    target: {
                                        offsetNode: text,
                                        offset: 1,
                                    },
                                    inputType: 'formatBold',
                                    defaultPrevented: false,
                                    actions: [
                                        {
                                            format: 'bold',
                                            type: 'applyFormat',
                                            origin: 'EventNormalizer',
                                            data: null,
                                        },
                                    ],
                                },
                            ],
                            mutatedElements: new Set([text2, text, text3, span, b]),
                        },
                    ]);
                });
            });
        });
    });
});
