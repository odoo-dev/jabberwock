/* eslint-disable max-nested-callbacks */
/**
 * Disable the atomic updates because we currently need to reset `ctx.eventBatchs` each test.
 */
/* eslint-disable require-atomic-updates */
import { expect } from 'chai';
import { Direction } from '../src/VRange';
import {
    testCallbackAfter,
    TestContext,
    triggerEvent,
    setRange,
    nextTick,
} from './eventNormalizerUtils';
import { testCallbackBefore } from './eventNormalizerUtils';
import { EventBatch, NormalizedPointerEvent } from '../src/EventNormalizer';

describe('utils', () => {
    describe('EventNormalizer', () => {
        let ctx: TestContext;

        before(() => {
            ctx = testCallbackBefore();
        });
        after(() => {
            testCallbackAfter(ctx);
        });

        describe('pointer', () => {
            describe('set range', () => {
                it('click outside do nothing (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>abc</div>';
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.other, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(ctx.other.firstChild, 1, ctx.other.firstChild, 1);
                    setRange(ctx.other.firstChild, 1, ctx.other.firstChild, 2);
                    triggerEvent(ctx.other, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    triggerEvent(ctx.other, 'mouseup', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    await nextTick();
                    await nextTick();
                    expect(ctx.eventBatches).to.deep.equal([]);
                });
                it('click on border set range at the begin (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<div style="position: absolute; left: 250px;">abc</div>';
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 5,
                        clientY: 5,
                    });
                    setRange(ctx.other.firstChild, 1, ctx.other.firstChild, 1);
                    triggerEvent(ctx.editable, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 5,
                        clientY: 5,
                    });
                    triggerEvent(ctx.editable, 'mouseup', {
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
                            offsetNode: ctx.editable,
                            offset: 0,
                        },
                        defaultPrevented: false,
                        actions: [
                            {
                                type: 'setRange',
                                domRange: {
                                    startContainer: ctx.editable,
                                    startOffset: 0,
                                    endContainer: ctx.editable,
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('right click outside do nothing (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>abc</div>';
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.other, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(ctx.other.firstChild, 1, ctx.other.firstChild, 1);
                    triggerEvent(ctx.other, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 200,
                        clientY: 200,
                    });
                    setRange(ctx.other.firstChild, 0, ctx.other.firstChild, 2);
                    await nextTick();
                    await nextTick();
                    expect(ctx.eventBatches).to.deep.equal([]);
                });
                it('mouse setRange (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = ctx.editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    const text2 = p2.firstChild;
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('mouse setRange contenteditable false', async () => {
                    ctx.editable.innerHTML = 'abc<i contentEditable="false">test</i>def';
                    const text = ctx.editable.firstChild;
                    const i = ctx.editable.childNodes[1];
                    await nextTick();
                    ctx.eventBatches.splice(0);

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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('touchdown setRange (googleKeyboard)', async () => {
                    ctx.editable.innerHTML = '<div>abc def</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild;
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    triggerEvent(ctx.editable, 'compositionstart', { data: '' });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'def' });
                    await nextTick();
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'def' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('touchdown setRange move inside a word (googleKeyboard)', async () => {
                    ctx.editable.innerHTML = '<div>abc def</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild;
                    setRange(text, 3, text, 3);

                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'def' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('mouse setRange with contextMenu (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>abc</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild;
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('mouse setRange on input (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>ab<input/>cd</div>';
                    const p = ctx.editable.firstChild;
                    const text1 = p.firstChild;
                    const input = p.childNodes[1];
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('completion/correction', () => {
                // todo: correct what?
                it('should correct a word (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a hillo b');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 7, text, 7);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionstart', {});
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hillo' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    text.textContent = 'a hello b';
                    triggerEvent(ctx.editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hello' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'compositionend', { data: 'hello' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                // todo: displace in pointer section?
                it('should auto-correct a word (safari)', async () => {
                    // same test in mutation normalizer for the change
                    // we test that the correction trigger only a input
                    // and don't trigger composition event
                    const p = document.createElement('p');
                    const text = document.createTextNode('And the mome rates outgrabe.');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 18, text, 18);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'raths',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'And the mome outgrabe.';
                    text.textContent = 'And the mome raths outgrabe.';
                    triggerEvent(ctx.editable, 'input', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('should correct with bold (SwiftKey)', async () => {
                    ctx.editable.innerHTML = '<div>.<b>chr</b>is .</div>';
                    const div = ctx.editable.childNodes[0];
                    const b = div.childNodes[1];
                    const firstText = div.firstChild;
                    const textB = b.firstChild;
                    const text = div.childNodes[2];
                    setRange(text, 2, text, 2);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionstart', {});
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'chris' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'Christophe' });

                    div.removeChild(firstText); // remove first text node
                    b.removeChild(textB); // remove text in b
                    div.removeChild(b); // remove b
                    const newText = document.createTextNode('.');
                    div.insertBefore(newText, text); // re-create first text node
                    const newB = document.createElement('b');
                    newB.textContent = 'Christophe';
                    div.insertBefore(newB, text); // re-create b
                    text.textContent = '\u00A0.'; // update text node

                    triggerEvent(ctx.editable, 'input', {
                        data: 'Christophe',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionend', { data: 'Christophe' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('should complete with repeat (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('Ha ha ha ha ha');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 9, text, 9);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionstart', {});
                    triggerEvent(ctx.editable, 'compositionupdate', { data: '' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'compositionstart', {});
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'ha',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'ha' });
                    text.textContent = 'Ha ha ha haha ha';
                    triggerEvent(ctx.editable, 'input', {
                        data: 'ha',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionend', { data: 'ha' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: ' ',
                        inputType: 'insertText',
                    });
                    text.textContent = 'Ha ha ha ha ha ha';
                    triggerEvent(ctx.editable, 'input', { data: ' ', inputType: 'insertText' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('should correct (googleKeyboard)', async () => {
                    ctx.editable.innerHTML = '<div>abc def</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionend', { data: 'aXc' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'deleteContentBackward',
                    });
                    text.textContent = 'c def';
                    // in real googleKeyboard realase the mutation just after input without
                    // timeout, in this test it's impositble to do that. But the implementation
                    // use a setTimeout, the mutation stack is the same.
                    triggerEvent(ctx.editable, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'deleteContentBackward',
                    });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(ctx.editable, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'insertText',
                        data: 'aXc',
                    });
                    text.textContent = 'aXc def';
                    text.textContent = 'aXc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(ctx.editable, 'input', { inputType: 'insertText', data: 'aXc' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('should correct by same value (googleKeyboard)', async () => {
                    ctx.editable.innerHTML = '<div>abc def</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild as Text;
                    setRange(text, 2, text, 2);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionend', { data: 'abc' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'deleteContentBackward',
                    });
                    text.textContent = 'c def';
                    triggerEvent(ctx.editable, 'input', { inputType: 'deleteContentBackward' });
                    setRange(text, 1, text, 1);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'deleteContentBackward',
                    });
                    text.textContent = ' def';
                    text.textContent = ' def';
                    triggerEvent(ctx.editable, 'input', { inputType: 'deleteContentBackward' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'insertText',
                        data: 'abc',
                    });
                    text.textContent = 'abc def';
                    setRange(text, 3, text, 3);
                    triggerEvent(ctx.editable, 'input', { inputType: 'insertText', data: 'abc' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('completion on BR (SwiftKey)', async () => {
                    const p = document.createElement('p');
                    const br = document.createElement('br');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(br);
                    setRange(p, 0, p, 0);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'compositionstart', { data: '' });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: '' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'compositionstart', { data: '' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hello' });
                    const text = document.createTextNode('');
                    p.insertBefore(text, br);
                    p.removeChild(br);
                    text.textContent = 'hello';
                    triggerEvent(ctx.editable, 'input', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'compositionend', { data: 'hello' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: ' ',
                        inputType: 'insertText',
                    });
                    text.textContent = 'hello ';
                    text.textContent = 'hello\u00A0';
                    setRange(text, 6, text, 6);
                    triggerEvent(ctx.editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                it('should correct (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a brillig b');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(ctx.editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'a brill b';
                    triggerEvent(ctx.editable, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should correct in i tag (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const i = document.createElement('i');
                    const text = document.createTextNode('a brillig b');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(i);
                    i.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(ctx.editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        inputType: 'insertReplacementText',
                    });
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
                    triggerEvent(ctx.editable, 'input', { inputType: 'insertReplacementText' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should correct at end (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = ctx.editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });
                    text.textContent = 'slithy toes';
                    triggerEvent(ctx.editable, 'input', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should correct at middle (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<p><i>’Twas brillig, and the slithy toves</i><br/></p>';
                    const p = ctx.editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild as Text;
                    setRange(text, 6, text, 13);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
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

                    triggerEvent(ctx.editable, 'input', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should correct at end of i tag (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<p><i>slithy toves</i></p>';
                    const p = ctx.editable.firstChild;
                    const i = p.firstChild;
                    const text = i.firstChild;
                    setRange(text, 7, text, 12);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'toes',
                        inputType: 'insertReplacementText',
                    });

                    text.textContent = 'slithy ';
                    text.textContent = 'slithy ';
                    const text2 = document.createTextNode('toes');
                    ctx.editable.appendChild(text2);
                    const br = document.createElement('br');
                    ctx.editable.insertBefore(br, text2);
                    text2.textContent = '';
                    ctx.editable.removeChild(text2);
                    ctx.editable.removeChild(br);
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

                    triggerEvent(ctx.editable, 'input', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should correct (Edge)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('a brillig b');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 20,
                        clientY: 10,
                    });
                    setRange(text, 2, text, 9);
                    triggerEvent(ctx.editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 20,
                        clientY: 10,
                    });

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    text.textContent = 'a  b';
                    text.textContent = 'a brill b';
                    // await nextTick(); TODO with Edge next version
                    triggerEvent(ctx.editable, 'input', {});
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('select all', () => {
                it('mouse select (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = 'a<br/>b';
                    const text = ctx.editable.firstChild;
                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 8,
                        clientY: 10,
                    });
                    setRange(text, 1, text, 1);
                    triggerEvent(ctx.editable, 'contextmenu', {
                        button: 2,
                        detail: 0,
                        clientX: 8,
                        clientY: 10,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(ctx.editable, 0, ctx.other.firstChild, 3);
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
                                    startContainer: ctx.editable,
                                    startOffset: 0,
                                    endContainer: ctx.other.firstChild,
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('mouse select all on content wrap by br (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<div><br/><br/>a</div><div>b</div><div>c<br/><br/></div>';
                    const p1 = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = ctx.editable.childNodes[2];
                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('mouse select all with invisible content (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = ctx.editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = ctx.editable.childNodes[1] as HTMLElement;
                    const text2 = p2.firstChild;
                    const p3 = ctx.editable.childNodes[2];
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
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('wrong mouse select all without event (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = ctx.editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = ctx.editable.childNodes[2];
                    await nextTick();
                    triggerEvent(p2, 'mousedown', { button: 2, detail: 1 });
                    setRange(text2, 0, text2, 1);
                    triggerEvent(p2, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    setRange(text1, 0, p3, 2);
                    await nextTick();
                    await nextTick();
                    expect(ctx.eventBatches).to.deep.equal([]);
                });
                it('wrong mouse select all without event 2 (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i>text</i></div>';
                    const p1 = ctx.editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = ctx.editable.lastChild;
                    const text3 = p3.lastChild.firstChild;
                    await nextTick();
                    triggerEvent(p2, 'mousedown', { button: 2, detail: 1 });
                    setRange(text2, 1, text2, 1);
                    triggerEvent(p2, 'contextmenu', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    setRange(text1, 0, text3, 3);
                    await nextTick();
                    await nextTick();
                    expect(ctx.eventBatches).to.deep.equal([]);
                });
                it('touch select all (android)', async () => {
                    ctx.editable.innerHTML =
                        '<div>a</div><div>b</div><div>c<br/><br/><i style="display: none;">text</i></div>';
                    const p1 = ctx.editable.firstChild;
                    const text1 = p1.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    const text2 = p2.firstChild;
                    const p3 = ctx.editable.childNodes[2];
                    setRange(text1, 0, text1, 0);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('cut', () => {
                it('use mouse cut (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    // todo: verify and changes the names for all the tests
                    const p = ctx.editable.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 11,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text3, 2);
                    triggerEvent(ctx.editable.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(ctx.editable.lastChild, 'mouseup', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                // skip this test as we do not support Edge witout blink engine
                it.skip('use mouse cut (Edge)', async () => {
                    ctx.editable.innerHTML = '<div>abc<br/>def<br/>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const text1 = p.childNodes[0];
                    const br1 = p.childNodes[1];
                    const text2 = p.childNodes[2];
                    const br2 = p.childNodes[3];
                    const text3 = p.childNodes[4];
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(p, 'mousedown', {
                        button: 2,
                        detail: 1,
                        clientX: 11,
                        clientY: 10,
                    });
                    setRange(text1, 1, text1, 1);
                    setRange(text1, 1, text3, 2);
                    triggerEvent(ctx.editable.lastChild, 'click', {
                        button: 2,
                        detail: 0,
                        clientX: 22,
                        clientY: 45,
                    });
                    triggerEvent(ctx.editable.lastChild, 'mouseup', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('paste', () => {
                // todo: currently the offset is 0 but should be 1.
                //       nby: I don't understand why. ask chm more infos
                it.skip('paste with context menu', async () => {
                    ctx.editable.innerHTML = '<div>abc</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild;
                    setRange(text, 1, text, 1);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('drag and drop', () => {
                it('from self content', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from self empty link', async () => {
                    ctx.editable.innerHTML =
                        '<div>a<a href="https://www.odoo.com"></a>c</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const a = p.childNodes[1];
                    const p2 = ctx.editable.childNodes[1];
                    setRange(a, 0, a, 0);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from self custom content', async () => {
                    ctx.editable.innerHTML = '<div>a<svg></svg>c</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const svg = ctx.editable.querySelector('svg');
                    const p2 = ctx.editable.childNodes[1];

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
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from browser navbar link', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from external text', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from external content', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from external image', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from external link', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from external empty link', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('from pictures folder', async () => {
                    ctx.editable.innerHTML = '<div>abc</div><div>def</div><div>ghi</div>';
                    const p = ctx.editable.firstChild;
                    const p2 = ctx.editable.childNodes[1];
                    setRange(p.firstChild, 1, p.firstChild, 2);
                    await nextTick();
                    ctx.eventBatches.splice(0);

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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('history', () => {
                it('mouse history undo (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
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
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(ctx.editable, 'input', { inputType: 'historyUndo' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('format', () => {
                it('apply bold with context menu (or menu bar) (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);

                    await nextTick();
                    triggerEvent(p, 'mousedown', { button: 2, detail: 1 });
                    setRange(text, 1, text, 4);
                    triggerEvent(p, 'click', { button: 2, detail: 0 });
                    triggerEvent(p, 'mouseup', { button: 2, detail: 0 });
                    await nextTick();
                    await nextTick();

                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'beforeinput', { inputType: 'formatBold' });
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
                    triggerEvent(ctx.editable, 'input', { inputType: 'formatBold' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });
        });
    });
});
