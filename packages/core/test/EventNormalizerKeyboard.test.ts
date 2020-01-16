/* eslint-disable max-nested-callbacks */
/**
 * Disable the atomic updates because we currently need to reset `ctx.eventBatchs` each test.
 */
/* eslint-disable require-atomic-updates */
import { expect } from 'chai';
import { Direction } from '../src/VRange';
import { DeleteWordAction } from '../src/EventNormalizer';
import {
    testCallbackAfter,
    TestContext,
    triggerEvent,
    setRange,
    nextTick,
    triggerEvents,
} from './eventNormalizerUtils';
import {
    testContentNormalizer,
    resetElementsIds,
    testCallbackBefore,
} from './eventNormalizerUtils';
import {
    EventBatch,
    NormalizedKeyboardEvent,
    NormalizedPointerEvent,
} from '../src/EventNormalizer';

describe('utils', () => {
    describe.only('EventNormalizer', () => {
        let ctx: TestContext;

        before(() => {
            ctx = testCallbackBefore();
        });
        after(() => {
            testCallbackAfter(ctx);
        });

        it('Check if your browser have an available font (Courier) to have valid test', async () => {
            ctx.editable.innerHTML = '<span>i</span>';
            const rect = (ctx.editable.firstChild as HTMLElement).getBoundingClientRect();
            expect(rect.height).to.equal(20);
            expect(rect.width).to.gt(10.5);
            expect(rect.width).to.lt(11);
        });

        describe('keyboard', () => {
            describe('insert', () => {
                describe('insert char at the end of a word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let gboardPointerEvent: NormalizedPointerEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        resetElementsIds(ctx.editable);
                        p = document.getElementById('element-0');
                        text = p.childNodes[0];
                        await nextTick();
                        ctx.eventBatches.splice(0);

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
                        gboardPointerEvent = {
                            type: 'pointer',
                            compositionFrom: 'world',
                            compositionTo: 'worldo',
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'setRange',
                                    domRange: {
                                        direction: Direction.BACKWARD,
                                        startContainer: text,
                                        startOffset: 11,
                                        endContainer: text,
                                        endOffset: 16,
                                    },
                                },
                                {
                                    text: 'worldo',
                                    type: 'insertText',
                                },
                            ],
                        };
                        // virtual keyboards does not provide code
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });
                    it('should insert char at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldo',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldo',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worlds',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);
                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldo',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);
                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (mac firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worlds',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': 'world' },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'beforeinput',
                                    'data': 'worldo',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'compositionupdate', 'data': 'worldo' },
                                {
                                    'type': 'input',
                                    'data': 'worldo',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldo',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [gboardPointerEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char at the end of a word (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldo',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('insert space at the end of a word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        resetElementsIds(ctx.editable);
                        p = document.getElementById('element-0');
                        text = p.childNodes[0];
                        setRange(text, 5, text, 5);
                        await nextTick();
                        ctx.eventBatches.splice(0);

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

                        // virtual keyboards does not provide code
                        virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                    });
                    it('should insert space at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': ' ', 'code': 'Space' },
                                { 'type': 'keypress', 'key': ' ', 'code': 'Space' },
                                { 'type': 'beforeinput', 'data': ' ', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        // todo: each time there we deep equal, if we set a type for the evaluated
                        // variable, it is easier to rename
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': ' ', 'code': 'Space' },
                                { 'type': 'keypress', 'key': ' ', 'code': 'Space' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': ' ', 'code': 'Space' },
                                { 'type': 'keypress', 'key': ' ', 'code': 'Space' },
                                { 'type': 'beforeinput', 'data': ' ', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': ' ', 'code': 'Space' },
                                { 'type': 'keypress', 'key': ' ', 'code': 'Space' },
                                { 'type': 'beforeinput', 'data': ' ', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (mac firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': ' ', 'code': 'Space' },
                                { 'type': 'keypress', 'key': ' ', 'code': 'Space' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': 'world' },
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'beforeinput',
                                    'data': 'world',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'compositionupdate', 'data': 'world' },
                                {
                                    'type': 'input',
                                    'data': 'world',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'compositionend', 'data': 'world' },
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': ' ', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert space at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': 'world' },
                            ],
                            [
                                { 'type': 'compositionend', 'data': 'world' },
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': ' ', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': ' ', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world ',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [virtualKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('insert char with accent at the end of a word', function() {
                    let keyboardEvent: NormalizedKeyboardEvent;
                    let virtualKeyboardEvent: NormalizedKeyboardEvent;
                    let macAccentKeyboardEvent: NormalizedKeyboardEvent;
                    let macKeystrokeKeyboardEvent: NormalizedKeyboardEvent;
                    let macSafariKeystrokeKeyboardEvent: NormalizedKeyboardEvent;
                    let gboardPointerEvent: NormalizedPointerEvent;
                    let p: HTMLElement;
                    let text: ChildNode;
                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        resetElementsIds(ctx.editable);
                        p = document.getElementById('element-0');
                        text = p.childNodes[0];

                        await nextTick();
                        ctx.eventBatches.splice(0);

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
                                        startOffset: 16,
                                        endContainer: text,
                                        endOffset: 17,
                                        direction: Direction.BACKWARD,
                                    },
                                },
                                {
                                    text: 'ô',
                                    type: 'insertText',
                                },
                            ],
                        };
                        macSafariKeystrokeKeyboardEvent = {
                            ...macKeystrokeKeyboardEvent,
                            inputType: 'insertFromComposition',
                        };
                        gboardPointerEvent = {
                            type: 'pointer',
                            compositionFrom: 'world',
                            compositionTo: 'worldô',
                            defaultPrevented: false,
                            actions: [
                                {
                                    type: 'setRange',
                                    domRange: {
                                        direction: Direction.BACKWARD,
                                        startContainer: text,
                                        startOffset: 11,
                                        endContainer: text,
                                        endOffset: 16,
                                    },
                                },
                                {
                                    text: 'worldô',
                                    type: 'insertText',
                                },
                            ],
                        };
                    });
                    it('should insert char with accent at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'Dead', 'code': 'BracketLeft' }],
                            [
                                { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'ô', 'code': 'KeyO' },
                                { 'type': 'beforeinput', 'data': 'ô', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'ô', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (ubuntu firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [{ 'type': 'keydown', 'key': 'Dead', 'code': 'BracketLeft' }],
                            [{ 'type': 'keyup', 'key': 'Dead', 'code': 'BracketLeft' }],
                            [
                                { 'type': 'keydown', 'key': 'ô', 'code': 'KeyO' },
                                { 'type': 'keypress', 'key': 'ô', 'code': 'KeyO' },
                                { 'type': 'input', 'data': 'ô', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac safari)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': '^' },
                                {
                                    'type': 'beforeinput',
                                    'data': '^',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'input',
                                    'data': '^',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world^',
                                    'targetId': 2,
                                },
                                { 'type': 'keydown', 'key': 'Dead', 'code': 'BracketLeft' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': '^', 'code': 'BracketLeft' }],
                            [
                                {
                                    'type': 'beforeinput',
                                    'data': null,
                                    'inputType': 'deleteCompositionText',
                                },
                                {
                                    'type': 'input',
                                    'data': null,
                                    'inputType': 'deleteCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'beforeinput',
                                    'data': 'ô',
                                    'inputType': 'insertFromComposition',
                                },
                                {
                                    'type': 'input',
                                    'data': 'ô',
                                    'inputType': 'insertFromComposition',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                { 'type': 'compositionend', 'data': 'ô' },
                                { 'type': 'keydown', 'key': 'ô', 'code': 'KeyO' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);
                        // triggerEvent(ctx.editable, 'compositionstart', {});
                        // triggerEvent(ctx.editable, 'compositionupdate', { data: '^' });
                        // triggerEvent(ctx.editable, 'beforeInput', {
                        //     data: '^',
                        //     inputType: 'insertCompositionText',
                        // });
                        // text.textContent = 'hell^';
                        // triggerEvent(ctx.editable, 'input', {
                        //     data: '^',
                        //     inputType: 'insertCompositionText',
                        // });
                        // triggerEvent(ctx.editable, 'keydown', { key: 'Dead', code: 'BracketLeft' });
                        // setRange(text, 5, text, 5);
                        // await nextTick();
                        // await nextTick();

                        // triggerEvent(ctx.editable, 'beforeInput', {
                        //     data: 'null',
                        //     inputType: 'deleteContentBackwards',
                        // });
                        // triggerEvent(ctx.editable, 'input', {
                        //     data: 'null',
                        //     inputType: 'deleteContentBackwards',
                        // });
                        // triggerEvent(ctx.editable, 'beforeInput', {
                        //     data: 'ô',
                        //     inputType: 'insertFromComposition',
                        // });
                        // text.textContent = 'hellô';
                        // triggerEvent(ctx.editable, 'input', {
                        //     data: 'ô',
                        //     inputType: 'insertFromComposition',
                        // });
                        // triggerEvent(ctx.editable, 'compositionend', { data: 'ô' });
                        // triggerEvent(ctx.editable, 'keydown', { key: 'ô', code: 'KeyO' });
                        // setRange(text, 5, text, 5);
                        // await nextTick();
                        // triggerEvent(ctx.editable, 'keyup', { key: 'o', code: 'KeyO' });
                        // await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [macAccentKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                            {
                                events: [macSafariKeystrokeKeyboardEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Dead', 'code': 'BracketLeft' },
                                { 'type': 'compositionstart', 'data': '' },
                                {
                                    'type': 'beforeinput',
                                    'data': '^',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'compositionupdate', 'data': '^' },
                                {
                                    'type': 'input',
                                    'data': '^',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world^',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'Dead', 'code': 'BracketLeft' }],
                            [
                                { 'type': 'keydown', 'key': 'ô', 'code': 'KeyO' },
                                {
                                    'type': 'beforeinput',
                                    'data': 'ô',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'compositionupdate', 'data': 'ô' },
                                {
                                    'type': 'input',
                                    'data': 'ô',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                { 'type': 'compositionend', 'data': 'ô' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (mac firefox)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Dead', 'code': 'BracketLeft' },
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': '^' },
                                {
                                    'type': 'input',
                                    'data': '^',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello world^',
                                    'targetId': 2,
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': '^', 'code': 'BracketLeft' }],
                            [
                                { 'type': 'keydown', 'key': 'ô', 'code': 'KeyO' },
                                { 'type': 'compositionupdate', 'data': 'ô' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                { 'type': 'compositionend', 'data': 'ô' },
                                {
                                    'type': 'input',
                                    'data': 'ô',
                                    'inputType': 'insertCompositionText',
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (SwiftKey)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                { 'type': 'beforeinput', 'data': 'ô', 'inputType': 'insertText' },
                                { 'type': 'input', 'data': 'ô', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('should insert char with accent at the end of a word (GBoard)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                },
                            ],
                            [
                                { 'type': 'compositionstart', 'data': '' },
                                { 'type': 'compositionupdate', 'data': 'world' },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'beforeinput',
                                    'data': 'worldô',
                                    'inputType': 'insertCompositionText',
                                },
                                { 'type': 'compositionupdate', 'data': 'worldô' },
                                {
                                    'type': 'input',
                                    'data': 'worldô',
                                    'inputType': 'insertCompositionText',
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': 'Hey, hello worldô',
                                    'targetId': 2,
                                },
                                { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'targetSelectionId': 2, 'offset': 17 },
                                    'anchor': { 'targetSelectionId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                events: [gboardPointerEvent],
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                it('should insert multiples key in same stack (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', { key: 'o', code: 'KeyO' });
                    triggerEvent(ctx.editable, 'keypress', { key: 'o', code: 'KeyO' });
                    triggerEvent(ctx.editable, 'beforeinput', {
                        data: 'o',
                        inputType: 'insertText',
                    });
                    text.textContent = 'hello';
                    triggerEvent(ctx.editable, 'input', { data: 'o', inputType: 'insertText' });
                    setRange(text, 5, text, 5);
                    triggerEvent(ctx.editable, 'keydown', { key: 'i', code: 'KeyI' });
                    triggerEvent(ctx.editable, 'keypress', { key: 'i', code: 'KeyI' });
                    triggerEvent(ctx.editable, 'beforeinput', {
                        data: 'i',
                        inputType: 'insertText',
                    });
                    text.textContent = 'helloi';
                    triggerEvent(ctx.editable, 'input', { data: 'i', inputType: 'insertText' });
                    setRange(text, 6, text, 6);
                    triggerEvent(ctx.editable, 'keydown', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(ctx.editable, 'keypress', { key: 'Backspace', code: 'Backspace' });
                    triggerEvent(ctx.editable, 'beforeinput', {
                        inputType: 'deleteContentBackward',
                    });
                    text.textContent = 'hello';
                    triggerEvent(ctx.editable, 'input', { inputType: 'deleteContentBackward' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it.skip('multi keypress with accent (mac)', async () => {
                    ctx.editable.innerHTML = testContentNormalizer.hell;
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    await triggerEvents([
                        [
                            {
                                type: 'selection',
                                focus: { targetSelectionId: 2, offset: 4 },
                                anchor: { targetSelectionId: 2, offset: 4 },
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
                                focus: { targetSelectionId: 2, offset: 5 },
                                anchor: { targetSelectionId: 2, offset: 5 },
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
                                focus: { targetSelectionId: 2, offset: 5 },
                                anchor: { targetSelectionId: 2, offset: 5 },
                            },
                            {
                                type: 'selection',
                                focus: { targetSelectionId: 2, offset: 5 },
                                anchor: { targetSelectionId: 2, offset: 5 },
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                // todo: Test long keypress on a key on mac. It should not trigger many keys if
                //       nothing has changed in the document
                // todo: Test when mac (only safari?) trigger insert "insertReplacementText" or
                //       "insertText"
            });

            describe('completion/correction', () => {
                it('should add space when hitting a word completion (SwiftKey)', async () => {
                    ctx.editable.innerHTML = testContentNormalizer.ahello;
                    resetElementsIds(ctx.editable);
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];
                    setRange(text, 7, text, 7);

                    await nextTick();
                    ctx.eventBatches.splice(0);

                    triggerEvent(ctx.editable, 'compositionstart', {});
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hello' });
                    triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified' });
                    triggerEvent(ctx.editable, 'beforeInput', {
                        data: 'hello',
                        inputType: 'insertCompositionText',
                    });
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
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
                    text.textContent = 'a hello ';
                    triggerEvent(ctx.editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should add space from auto-correction (SwiftKey)', async () => {
                    ctx.editable.innerHTML = testContentNormalizer.ahillo;
                    resetElementsIds(ctx.editable);
                    const p = document.getElementById('element-0');
                    const text = p.childNodes[0];
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
                    triggerEvent(ctx.editable, 'compositionupdate', { data: 'hello' });
                    text.textContent = 'a hello';
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
                    text.textContent = 'a hello ';
                    triggerEvent(ctx.editable, 'input', { data: ' ', inputType: 'insertText' });
                    triggerEvent(ctx.editable, 'keyup', { key: 'Unidentified' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });

                // ? why?
                it('prevent default the keypress', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hell');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keyup', { key: 'Dead', code: 'BracketLeft' }); // no keydown, no keypress
                    await nextTick();
                    await nextTick();
                    triggerEvent(ctx.editable, 'keydown', { key: 'o', code: 'KeyO' });
                    await nextTick();
                    const ev = triggerEvent(ctx.editable, 'keypress', { key: 'ô', code: 'KeyO' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('backspace/delete', () => {
                const ctrlKeyEventBatch: EventBatch = {
                    events: [
                        {
                            type: 'keyboard',
                            key: 'Control',
                            code: 'ControlLeft',
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: false,
                            altKey: false,
                            actions: [],
                            defaultPrevented: false,
                        },
                    ],
                    mutatedElements: new Set(),
                };
                const shiftKeyEventBatch: EventBatch = {
                    events: [
                        {
                            type: 'keyboard',
                            key: 'Shift',
                            code: 'ShiftLeft',
                            ctrlKey: true,
                            metaKey: false,
                            shiftKey: true,
                            altKey: false,
                            actions: [],
                            defaultPrevented: false,
                        },
                    ],
                    mutatedElements: new Set(),
                };
                const macAltKeyEventBatch: EventBatch = {
                    events: [
                        {
                            type: 'keyboard',
                            key: 'Alt',
                            code: 'AltLeft',
                            ctrlKey: false,
                            metaKey: false,
                            shiftKey: false,
                            altKey: true,
                            actions: [],
                            defaultPrevented: false,
                        },
                    ],
                    mutatedElements: new Set(),
                };
                const macCmdKeyEventBatch: EventBatch = {
                    events: [
                        {
                            type: 'keyboard',
                            key: 'Meta',
                            code: 'MetaLeft',
                            ctrlKey: false,
                            metaKey: true,
                            shiftKey: false,
                            altKey: false,
                            actions: [],
                            defaultPrevented: false,
                        },
                    ],
                    mutatedElements: new Set(),
                };
                const macCmdFirefoxKeyEventBatch: EventBatch = {
                    events: [
                        {
                            type: 'keyboard',
                            key: 'Meta',
                            code: 'OSLeft',
                            ctrlKey: false,
                            metaKey: true,
                            shiftKey: false,
                            altKey: false,
                            actions: [],
                            defaultPrevented: false,
                        },
                    ],
                    mutatedElements: new Set(),
                };
                describe('backspace', () => {
                    describe('deleteContentBackward one letter', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let virtualKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            text = p.childNodes[0];
                            setRange(text, 5, text, 5);
                            await nextTick();
                            ctx.eventBatches.splice(0);

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

                            // virtual keyboards does not provide code
                            virtualKeyboardEvent = { ...keyboardEvent, code: '' };
                        });
                        it('should deleteContentBackward one letter (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (SwiftKey)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentBackward one letter (GBoard)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'compositionstart', 'data': '' },
                                    { 'type': 'compositionupdate', 'data': 'world' },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': 'worl',
                                        'inputType': 'insertCompositionText',
                                    },
                                    { 'type': 'compositionupdate', 'data': 'worl' },
                                    {
                                        'type': 'input',
                                        'data': 'worl',
                                        'inputType': 'insertCompositionText',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello worl',
                                        'targetId': 2,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 15 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward at the end of word', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let virtualKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            text = p.childNodes[0];
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                        text: 'world',
                                    },
                                ],
                            };
                            macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                            virtualKeyboardEvent = {
                                ...keyboardEvent,
                                code: '',
                                ctrlKey: false,
                                inputType: 'deleteContentBackward',
                            };
                        });
                        it('deleteWordBackward at the end of word (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward at the end of word (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward at the end of word (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward at the end of word (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward at the end of word (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteContentBackward at the end of word (SwiftKey)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 16 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 16 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, hello ',
                                        'targetId': 2,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 11 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 11 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // GBoard does not provide a way to delete a word with
                        // deleteWordBackward nor deleteWordBackward.
                    });
                    describe('deleteWordBackward or deleteContentBackward word in middle of sentence', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let virtualKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            text = p.childNodes[0];
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                        text: 'hello',
                                    },
                                ],
                            };
                            macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                            virtualKeyboardEvent = {
                                ...keyboardEvent,
                                code: '',
                                ctrlKey: false,
                                inputType: 'deleteContentBackward',
                            };
                        });

                        it('deleteWordBackward word in middle of sentence (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteContentBackward word in middle of sentence (SwiftKey)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward word in middle of sentence with style', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let macFireforxKeyboardEvent: NormalizedKeyboardEvent;
                        let virtualKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let lastText: ChildNode;
                        let b: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworldStyled;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            lastText = p.lastChild;
                            b = document.getElementById('element-1');
                            setRange(lastText, 0, lastText, 0);
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                        text: 'hello',
                                    },
                                ],
                            };
                            macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                            macFireforxKeyboardEvent = { ...macKeyboardEvent };
                            macFireforxKeyboardEvent.actions = [
                                ...macFireforxKeyboardEvent.actions,
                            ];
                            macFireforxKeyboardEvent.actions[0] = {
                                ...macFireforxKeyboardEvent.actions[0],
                                text: 'hello ',
                            } as DeleteWordAction;
                            virtualKeyboardEvent = {
                                ...keyboardEvent,
                                code: '',
                                ctrlKey: false,
                                inputType: 'deleteContentBackward',
                            };
                        });

                        it('deleteWordBackward word in middle of sentence with style (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence with style (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': '',
                                        'targetId': 4,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([b.childNodes[0]]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence with style (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'addedNodes': [
                                            {
                                                'parentId': 1,
                                                'mutationSpecType': 'id',
                                                'nodeValue':
                                                    '<span style="font-weight: bold; display: inline"></span>',
                                                'nodeType': 1,
                                                'previousSiblingId': 5,
                                            },
                                        ],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 6, 'mutationSpecType': 'id' }],
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence with style (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward word in middle of sentence with style (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 5, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 5, 'offset': 1 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey, world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macFireforxKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteContentBackward word in middle of sentence with style (SwiftKey)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 5 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward multi-styled word', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let virtualKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let lastText: ChildNode;
                        let b: ChildNode;
                        let bChild0: ChildNode;
                        let bChild1: ChildNode;
                        let bChild2: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworldMutlistyled;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            lastText = p.lastChild;
                            b = p.childNodes[1];
                            bChild0 = b.childNodes[0];
                            bChild1 = b.childNodes[1];
                            bChild2 = b.childNodes[2];

                            setRange(lastText, 1, lastText, 1);
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                        text: 'hello',
                                    },
                                ],
                            };
                            macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                            virtualKeyboardEvent = {
                                ...keyboardEvent,
                                code: '',
                                ctrlKey: false,
                                inputType: 'deleteContentBackward',
                            };
                        });

                        it('deleteWordBackward multi-styled word (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 7, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 7, 'offset': 1 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward multi-styled word (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 7, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 7, 'offset': 1 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': '',
                                        'targetId': 3,
                                        'removedNodes': [{ 'nodeId': 4, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': '',
                                        'targetId': 3,
                                        'removedNodes': [{ 'nodeId': 5, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': '',
                                        'targetId': 7,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([bChild0, bChild1, bChild2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward multi-styled word (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 7, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 7, 'offset': 1 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'addedNodes': [
                                            {
                                                'parentId': 1,
                                                'mutationSpecType': 'id',
                                                'nodeValue':
                                                    '<span style="font-weight: bold; display: inline"></span>',
                                                'nodeType': 1,
                                                'previousSiblingId': 8,
                                            },
                                        ],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 9, 'mutationSpecType': 'id' }],
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward multi-styled word (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 7, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 7, 'offset': 1 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'addedNodes': [
                                            {
                                                'parentId': 1,
                                                'mutationSpecType': 'id',
                                                'nodeValue':
                                                    '<span style="font-weight: bold; display: inline"></span>',
                                                'nodeType': 1,
                                                'previousSiblingId': 8,
                                            },
                                        ],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 9, 'mutationSpecType': 'id' }],
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteWordBackward multi-styled word (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 8, 'offset': 0 },
                                        'anchor': { 'targetSelectionId': 8, 'offset': 0 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([b]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteContentBackward multi-styled word (SwiftKey)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 7, 'offset': 1 },
                                        'anchor': { 'targetSelectionId': 7, 'offset': 1 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': 'Hey,  world',
                                        'targetId': 1,
                                        'removedNodes': [{ 'nodeId': 3, 'mutationSpecType': 'id' }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [virtualKeyboardEvent],
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteHardLineBackward or deleteSoftLineBackward', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let macChromeKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            text = p.firstChild;
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                            endContainer: text,
                                            endOffset: 10,
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
                            firefoxKeyboardEvent = {
                                ...keyboardEvent,
                                inputType: 'deleteSoftLineBackward',
                            };
                        });
                        it('deleteHardLineBackward (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteHardLineBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteHardLineBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'shiftKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Shift', 'code': 'ShiftLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteHardLineBackward (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteSoftLineBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 0 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 0 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [firefoxKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteHardLineBackward (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Meta',
                                        'code': 'MetaLeft',
                                        'metaKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'metaKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteHardLineBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteHardLineBackward',
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 0 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 0 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Meta', 'code': 'MetaLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macCmdKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteSoftLineBackward (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Meta',
                                        'code': 'MetaLeft',
                                        'metaKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'metaKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteSoftLineBackward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteSoftLineBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Meta', 'code': 'MetaLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macCmdKeyEventBatch,
                                {
                                    events: [macChromeKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('deleteSoftLineBackward (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 10 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 10 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Meta',
                                        'code': 'OSLeft',
                                        'metaKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Backspace',
                                        'code': 'Backspace',
                                        'metaKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteSoftLineBackward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 0 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 0 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Meta', 'code': 'OSLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macCmdFirefoxKeyEventBatch,
                                {
                                    events: [macChromeKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // impossible to delete a whole line backward on virtual devices
                    });
                    it('backspace (Edge)', async () => {
                        const p = document.createElement('p');
                        const text = document.createTextNode('hello');
                        ctx.editable.innerHTML = '';
                        ctx.editable.appendChild(p);
                        p.appendChild(text);
                        setRange(text, 5, text, 5);

                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        triggerEvent(ctx.editable, 'keypress', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        text.textContent = 'hell';
                        triggerEvent(ctx.editable, 'input', {});
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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });

                describe('delete', () => {
                    describe('deleteContentForward with delete', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');
                            text = p.childNodes[0];
                            setRange(text, 4, text, 4);
                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                        });
                        it('should deleteContentForward with delete (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Delete', 'code': 'Delete' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Delete', 'code': 'Delete' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentForward with delete (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': 'Hey, hello worldHillo world.',
                                        'targetId': 1,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Delete', 'code': 'Delete' },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Delete', 'code': 'Delete' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentForward with delete (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Delete', 'code': 'Delete' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Delete', 'code': 'Delete' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentForward with delete (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Delete', 'code': 'Delete' },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Delete', 'code': 'Delete' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('should deleteContentForward with delete (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    { 'type': 'keydown', 'key': 'Delete', 'code': 'Delete' },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteContentForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ello world',
                                        'targetId': 2,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Delete', 'code': 'Delete' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // todo: ask chm: how to trigger delete with SwiftKey?
                        it.skip('should deleteContentForward with delete (SwiftKey)', async () => {
                            const p = document.createElement('p');
                            const text = document.createTextNode('hello');
                            ctx.editable.innerHTML = '';
                            ctx.editable.appendChild(p);
                            p.appendChild(text);
                            setRange(text, 5, text, 5);

                            await nextTick();
                            ctx.eventBatches.splice(0);
                            triggerEvent(ctx.editable, 'keydown', {
                                key: 'Unidentified',
                                code: '',
                            });
                            triggerEvent(ctx.editable, 'keypress', {
                                key: 'Unidentified',
                                code: '',
                            });
                            triggerEvent(ctx.editable, 'beforeinput', {
                                inputType: 'deleteContentForward',
                            });
                            text.textContent = 'hell';
                            triggerEvent(ctx.editable, 'input', {
                                inputType: 'deleteContentForward',
                            });
                            setRange(text, 4, text, 4);
                            await nextTick();

                            const batchEvents: EventBatch[] = [
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    // describe.only('delete space+word in the middle of a sentence', () => {
                    describe('delete word in the middle of a sentence', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let macKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text2: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');

                            text2 = p.childNodes[0];
                            // setRange(text2, 2, text2, 2);

                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                        text: 'hello',
                                    },
                                ],
                            };
                            macKeyboardEvent = { ...keyboardEvent, ctrlKey: false, altKey: true };
                        });
                        it('delete word in the middle of a sentence (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete word in the middle of a sentence (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': 'Hey, hello worldHillo world.',
                                        'targetId': 1,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete word in the middle of a sentence (mac safari)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete word in the middle of a sentence (mac chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': 'Hey, hello worldHillo world.',
                                        'targetId': 1,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete word in the middle of a sentence (mac firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': 'Hey, hello worldHillo world.',
                                        'targetId': 1,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'attributes',
                                        'textContent': '',
                                        'targetId': 3,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Alt',
                                        'code': 'AltLeft',
                                        'altKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteWordForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey,  world',
                                        'targetId': 2,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'altKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Alt', 'code': 'AltLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                macAltKeyEventBatch,
                                {
                                    events: [macKeyboardEvent],
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('delete whole line forward', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;
                        let firefoxKeyboardEvent: NormalizedKeyboardEvent;
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);
                            p = document.getElementById('element-0');

                            text = p.childNodes[0];
                            setRange(text, 2, text, 2);

                            await nextTick();
                            ctx.eventBatches.splice(0);

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
                                            startContainer: text,
                                            startOffset: 5,
                                            endContainer: text,
                                            endOffset: 16,
                                            direction: Direction.FORWARD,
                                        },
                                    },
                                ],
                            };
                            firefoxKeyboardEvent = {
                                ...keyboardEvent,
                                inputType: 'deleteSoftLineForward',
                            };
                        });
                        it('delete whole line forward (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteHardLineForward',
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteHardLineForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'shiftKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Shift', 'code': 'ShiftLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete whole line forward (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 2, 'offset': 5 },
                                        'anchor': { 'targetSelectionId': 2, 'offset': 5 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                    {
                                        'type': 'input',
                                        'data': null,
                                        'inputType': 'deleteSoftLineForward',
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'Hey, ',
                                        'targetId': 2,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [firefoxKeyboardEvent],
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // impossible to delete the whole line forward in mac
                    });
                    describe('delete whole line forward and do nothing', () => {
                        let keyboardEvent: NormalizedKeyboardEvent;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            resetElementsIds(ctx.editable);

                            ctx.eventBatches.splice(0);

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
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 12 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 12 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                    {
                                        'type': 'beforeinput',
                                        'data': null,
                                        'inputType': 'deleteHardLineForward',
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        it('delete whole line forward and do nothing (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'targetSelectionId': 4, 'offset': 12 },
                                        'anchor': { 'targetSelectionId': 4, 'offset': 12 },
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Control',
                                        'code': 'ControlLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keydown',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Delete',
                                        'code': 'Delete',
                                        'ctrlKey': true,
                                        'shiftKey': true,
                                    },
                                ],
                                [
                                    {
                                        'type': 'keyup',
                                        'key': 'Shift',
                                        'code': 'ShiftLeft',
                                        'ctrlKey': true,
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                ctrlKeyEventBatch,
                                shiftKeyEventBatch,
                                {
                                    events: [keyboardEvent],
                                    mutatedElements: new Set([]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // impossible to delete the whole line forward in mac
                    });
                });
            });

            describe('enter', () => {
                describe('enter in the middle of the word', () => {
                    let keyboardEvent: NormalizedKeyboardEvent;

                    beforeEach(async () => {
                        resetElementsIds(ctx.editable);
                        await nextTick();
                        ctx.eventBatches.splice(0);

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
                    });

                    it('enter in the middle of the word (ubuntu chrome)', async () => {
                        ctx.editable.innerHTML = '<div>abcd</div>';
                        const p = ctx.editable.firstChild;
                        const text = p.firstChild;
                        setRange(text, 2, text, 2);
                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'keydown', { key: 'Enter', code: 'Enter' });
                        triggerEvent(ctx.editable, 'beforeInput', { inputType: 'insertParagraph' });

                        const newText = document.createTextNode('ab');
                        p.insertBefore(newText, text);
                        text.textContent = 'cd';
                        const newP = document.createElement('p');
                        ctx.editable.appendChild(newP);
                        newP.appendChild(text);
                        setRange(text, 0, text, 0);

                        triggerEvent(ctx.editable, 'input', { inputType: 'insertParagraph' });
                        await nextTick();
                        await nextTick();

                        const batchEvents: EventBatch[] = [
                            {
                                events: [keyboardEvent],
                                mutatedElements: new Set([newText, text, newP]),
                            },
                        ];
                        debugger;
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                    it('enter in the middle of the word (SwiftKey)', async () => {
                        ctx.editable.innerHTML = '<div>abcd</div>';
                        const p = ctx.editable.firstChild;
                        const text = p.firstChild;
                        setRange(text, 2, text, 2);
                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'beforeInput', { inputType: 'insertParagraph' });

                        const newText = document.createTextNode('ab');
                        p.insertBefore(newText, text);
                        text.textContent = 'cd';
                        const newP = document.createElement('p');
                        ctx.editable.appendChild(newP);
                        newP.appendChild(text);
                        setRange(text, 0, text, 0);

                        triggerEvent(ctx.editable, 'input', { inputType: 'insertParagraph' });
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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('enter before a word', () => {
                    it('enter before a word (Gboard)', async () => {
                        ctx.editable.innerHTML = '<div>abc def</div>';
                        const p = ctx.editable.firstChild;
                        const text = p.firstChild as Text;
                        setRange(text, 4, text, 4);
                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'compositionend', { data: 'def' });
                        await nextTick();
                        triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(ctx.editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'beforeInput', { inputType: 'insertParagraph' });

                        text.textContent = 'abc def';
                        const newText = document.createTextNode('abc\u00A0');
                        p.insertBefore(newText, text);
                        text.textContent = 'def';
                        const newP = document.createElement('p');
                        ctx.editable.appendChild(newP);
                        newP.appendChild(text);
                        setRange(text, 0, text, 0);

                        triggerEvent(ctx.editable, 'input', { inputType: 'insertParagraph' });
                        triggerEvent(ctx.editable, 'compositionstart', { data: '' });
                        triggerEvent(ctx.editable, 'compositionupdate', { data: 'def' });

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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('enter after a word', () => {
                    it('enter after a word (Gboard)', async () => {
                        ctx.editable.innerHTML = '<div>abc def</div>';
                        const p = ctx.editable.firstChild;
                        const text = p.firstChild as Text;
                        setRange(text, 3, text, 3);
                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'compositionend', { data: 'abc' });
                        await nextTick();
                        triggerEvent(ctx.editable, 'keydown', { key: 'Unidentified', code: '' });
                        triggerEvent(ctx.editable, 'keydown', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'keypress', { key: 'Enter', code: '' });
                        triggerEvent(ctx.editable, 'beforeInput', { inputType: 'insertParagraph' });

                        const newText = document.createTextNode('abc');
                        p.insertBefore(newText, text);
                        text.textContent = ' def';
                        const newP = document.createElement('p');
                        ctx.editable.appendChild(newP);
                        newP.appendChild(text);
                        text.textContent = 'def';
                        text.textContent = '\u00A0def';

                        setRange(text, 0, text, 0);

                        triggerEvent(ctx.editable, 'input', { inputType: 'insertParagraph' });

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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('shift + enter in the middle of a word ', () => {
                    it('shift + enter in the middle of a word (ubuntu chrome)', async () => {
                        ctx.editable.innerHTML = '<div>abcd</div>';
                        const p = ctx.editable.firstChild;
                        const text = p.firstChild;
                        setRange(text, 2, text, 2);
                        await nextTick();
                        ctx.eventBatches.splice(0);
                        triggerEvent(ctx.editable, 'keydown', { key: 'Enter', code: 'Enter' });
                        triggerEvent(ctx.editable, 'beforeInput', { inputType: 'insertLineBreak' });

                        const newText = document.createTextNode('ab');
                        p.insertBefore(newText, text);
                        text.textContent = 'cd';
                        const br = document.createElement('br');
                        p.insertBefore(br, text);
                        setRange(text, 0, text, 0);

                        triggerEvent(ctx.editable, 'input', { inputType: 'insertLineBreak' });
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
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                // todo: shift+ctrl+enter
            });

            describe('arrow', () => {
                it('arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                // ? when does these strange case comes from?
                it('strange case arrow without range', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    document.getSelection().removeAllRanges();
                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
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
                            events: [keyboardEvent],
                            mutatedElements: new Set([]),
                        },
                    ];
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('shift + arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('shift + ctrl + arrow (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 3, text, 3);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('select all', () => {
                it('ctrl + a (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(
                        ctx.editable.childNodes[1].firstChild,
                        1,
                        ctx.editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'a',
                        code: 'KeyQ',
                        ctrlKey: true,
                    });
                    setRange(
                        ctx.editable.firstChild.firstChild,
                        0,
                        ctx.editable.lastChild.lastChild,
                        1,
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
                                    offsetNode: ctx.editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: ctx.editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: ctx.editable.lastChild.lastChild,
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('ctrl + a on content finished by br (ubuntu chrome)', async () => {
                    ctx.editable.innerHTML = '<div>a</div><div>b</div><div>c<br/><br/></div>';
                    setRange(
                        ctx.editable.childNodes[1].firstChild,
                        1,
                        ctx.editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'Control',
                        code: 'ControlLeft',
                        ctrlKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'a',
                        code: 'KeyQ',
                        ctrlKey: true,
                    });
                    setRange(
                        ctx.editable.firstChild.firstChild,
                        0,
                        ctx.editable.lastChild.lastChild.previousSibling,
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
                                    offsetNode: ctx.editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: ctx.editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: ctx.editable.lastChild.lastChild.previousSibling,
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('ctrl + a (safari)', async () => {
                    ctx.editable.innerHTML = '<div>a</div><div>b</div><div>c</div>';
                    setRange(
                        ctx.editable.childNodes[1].firstChild,
                        1,
                        ctx.editable.childNodes[1].firstChild,
                        1,
                    );

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'Meta',
                        code: 'MetaLeft',
                        metaKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'a',
                        code: 'KeyQ',
                        metaKey: true,
                    });
                    triggerEvent(ctx.editable, 'keypress', {
                        key: 'a',
                        code: 'KeyQ',
                        metaKey: true,
                    });
                    await nextTick();
                    await nextTick();
                    setRange(
                        ctx.editable.firstChild.firstChild,
                        0,
                        ctx.editable.lastChild.lastChild,
                        1,
                    );
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
                                    offsetNode: ctx.editable.childNodes[1].firstChild,
                                    offset: 1,
                                },
                                domRange: {
                                    startContainer: ctx.editable.firstChild.firstChild,
                                    startOffset: 0,
                                    endContainer: ctx.editable.lastChild.lastChild,
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('cut', () => {
                it('ctrl + x to cut', async () => {
                    ctx.editable.innerHTML = '<div>abc<br/>abc<br/>abc</div>';
                    const div = ctx.editable.firstChild;
                    const text1 = div.childNodes[0];
                    const br1 = div.childNodes[1];
                    const text2 = div.childNodes[2];
                    const br2 = div.childNodes[3];
                    const text3 = div.childNodes[4];
                    setRange(text1, 1, text3, 2);
                    await nextTick();

                    ctx.eventBatches.splice(0);

                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'x',
                        code: 'KeyX',
                        ctrlKey: true,
                    });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('paste', () => {
                it('ctrl + v to paste', async () => {
                    ctx.editable.innerHTML = '<div>abc</div>';
                    const p = ctx.editable.firstChild;
                    const text = p.firstChild;
                    setRange(text, 1, text, 1);
                    await nextTick();

                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'v',
                        code: 'KeyV',
                        ctrlKey: true,
                    });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('history', () => {
                it('ctrl + z (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 4, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'z',
                        code: 'KeyW',
                        ctrlKey: true,
                    });
                    triggerEvent(ctx.editable, 'beforeinput', { inputType: 'historyUndo' });
                    text.textContent = 'hell';
                    setRange(text, 3, text, 3);
                    triggerEvent(ctx.editable, 'input', { inputType: 'historyUndo' });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('format', () => {
                it('ctrl + b (ubuntu chrome)', async () => {
                    const p = document.createElement('p');
                    const text = document.createTextNode('hello');
                    ctx.editable.innerHTML = '';
                    ctx.editable.appendChild(p);
                    p.appendChild(text);
                    setRange(text, 1, text, 4);

                    await nextTick();
                    ctx.eventBatches.splice(0);
                    triggerEvent(ctx.editable, 'keydown', {
                        key: 'b',
                        code: 'KeyB',
                        ctrlKey: true,
                    });
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
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            // todo: test modifier keys
            describe('modifier keys', () => {});
        });
    });
});
