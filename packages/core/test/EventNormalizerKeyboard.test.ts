/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { EventBatch, NormalizedAction } from '../src/EventNormalizer';
import { Direction } from '../src/VSelection';
import {
    testCallbackAfter,
    TestContext,
    triggerEvent,
    setRange,
    nextTick,
    triggerEvents,
    testContentNormalizer,
    testCallbackBefore,
} from './eventNormalizerUtils';

describe('utils', () => {
    describe('EventNormalizer', () => {
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
                    let keyboardActions: NormalizedAction[];
                    let gboardPointerActions: NormalizedAction[];
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        p = document.querySelector('p');
                        text = p.childNodes[0];
                        await nextTick();
                        ctx.eventBatches.splice(0);

                        keyboardActions = [
                            {
                                type: 'insertText',
                                text: 'o',
                            },
                        ];
                        gboardPointerActions = [
                            {
                                type: 'setSelection',
                                domSelection: {
                                    direction: Direction.FORWARD,
                                    anchorNode: text,
                                    anchorOffset: 11,
                                    focusNode: text,
                                    focusOffset: 16,
                                },
                            },
                            {
                                text: 'worldo',
                                type: 'insertText',
                            },
                        ];
                    });
                    it('should insert char at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);
                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);
                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: gboardPointerActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('insert space at the end of a word', () => {
                    let keyboardActions: NormalizedAction[];
                    let p: HTMLElement;
                    let text: ChildNode;

                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        p = document.querySelector('p');
                        text = p.childNodes[0];
                        setRange(text, 5, text, 5);
                        await nextTick();
                        ctx.eventBatches.splice(0);

                        keyboardActions = [
                            {
                                text: ' ',
                                type: 'insertText',
                            },
                        ];
                    });
                    it('should insert space at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': ' ', 'code': 'Space' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });
                describe('insert char with accent at the end of a word', function() {
                    let keyboardActions: NormalizedAction[];
                    let macAccentkeyboardActions: NormalizedAction[];
                    let macKeystrokekeyboardActions: NormalizedAction[];
                    let gboardPointerActions: NormalizedAction[];
                    let p: HTMLElement;
                    let text: ChildNode;
                    beforeEach(async () => {
                        ctx.editable.innerHTML = testContentNormalizer.helloworld;
                        p = document.querySelector('p');
                        text = p.childNodes[0];

                        await nextTick();
                        ctx.eventBatches.splice(0);

                        keyboardActions = [
                            {
                                type: 'insertText',
                                text: 'ô',
                            },
                        ];
                        macAccentkeyboardActions = [
                            {
                                text: '^',
                                type: 'insertText',
                            },
                        ];
                        macKeystrokekeyboardActions = [
                            {
                                type: 'setSelection',
                                domSelection: {
                                    anchorNode: text,
                                    anchorOffset: 16,
                                    focusNode: text,
                                    focusOffset: 17,
                                    direction: Direction.FORWARD,
                                },
                            },
                            {
                                text: 'ô',
                                type: 'insertText',
                            },
                        ];
                        gboardPointerActions = [
                            {
                                type: 'setSelection',
                                domSelection: {
                                    direction: Direction.FORWARD,
                                    anchorNode: text,
                                    anchorOffset: 11,
                                    focusNode: text,
                                    focusOffset: 16,
                                },
                            },
                            {
                                text: 'worldô',
                                type: 'insertText',
                            },
                        ];
                    });
                    it('should insert char with accent at the end of a word (ubuntu chrome)', async () => {
                        await triggerEvents([
                            [
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: macAccentkeyboardActions,
                                mutatedElements: new Set([text]),
                            },
                            {
                                actions: macKeystrokekeyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                            [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: macAccentkeyboardActions,
                                mutatedElements: new Set([text]),
                            },
                            {
                                actions: macKeystrokekeyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
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
                                actions: macAccentkeyboardActions,
                                mutatedElements: new Set([text]),
                            },
                            {
                                actions: macKeystrokekeyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'insertText',
                                text: 'ô',
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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
                                    'focus': { 'nodeId': 2, 'offset': 16 },
                                    'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 17 },
                                    'anchor': { 'nodeId': 2, 'offset': 17 },
                                },
                            ],
                        ]);

                        const batchEvents: EventBatch[] = [
                            {
                                actions: gboardPointerActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'insertText',
                            text: 'o',
                        },
                        {
                            type: 'insertText',
                            text: 'i',
                        },
                        {
                            type: 'deleteContent',
                            direction: Direction.BACKWARD,
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it.skip('multi keypress with accent (mac)', async () => {
                    //     ctx.editable.innerHTML = '<p>hell</p>';
                    //     const p = document.querySelector('p');
                    //     const text = p.childNodes[0];
                    //     await nextTick();
                    //     ctx.eventBatches.splice(0);
                    //     await triggerEvents([
                    //         [
                    //             {
                    //                 type: 'selection',
                    //                 focus: { targetSelectionId: 2, offset: 4 },
                    //                 anchor: { targetSelectionId: 2, offset: 4 },
                    //             },
                    //         ],
                    //         [
                    //             { type: 'keydown', key: 'Dead', code: 'BracketLeft' },
                    //             { type: 'compositionstart', data: '' },
                    //             { type: 'beforeinput', data: '^', inputType: 'insertCompositionText' },
                    //             { type: 'compositionupdate', data: '^' },
                    //             { type: 'input', data: '^', inputType: 'insertCompositionText' },
                    //             {
                    //                 type: 'mutation',
                    //                 mutationType: 'characterData',
                    //                 textContent: 'hell^',
                    //                 targetParentId: 'element-0',
                    //                 targetIndex: 0,
                    //             },
                    //             {
                    //                 type: 'selection',
                    //                 focus: { targetSelectionId: 2, offset: 5 },
                    //                 anchor: { targetSelectionId: 2, offset: 5 },
                    //             },
                    //             { type: 'keydown', key: 'ô', code: 'KeyO' },
                    //             { type: 'beforeinput', data: 'ô', inputType: 'insertCompositionText' },
                    //             { type: 'compositionupdate', data: 'ô' },
                    //             { type: 'input', data: 'ô', inputType: 'insertCompositionText' },
                    //             {
                    //                 type: 'mutation',
                    //                 mutationType: 'characterData',
                    //                 textContent: 'hellô',
                    //                 targetParentId: 'element-0',
                    //                 targetIndex: 0,
                    //             },
                    //             {
                    //                 type: 'selection',
                    //                 focus: { targetSelectionId: 2, offset: 5 },
                    //                 anchor: { targetSelectionId: 2, offset: 5 },
                    //             },
                    //             {
                    //                 type: 'selection',
                    //                 focus: { targetSelectionId: 2, offset: 5 },
                    //                 anchor: { targetSelectionId: 2, offset: 5 },
                    //             },
                    //         ],
                    //         [{ type: 'keyup', key: 'o', code: 'KeyO' }],
                    //         [{ type: 'keyup', key: 'Dead', code: 'BracketLeft' }],
                    //     ]);
                    //     const keyboardActions: NormalizedAction[] = [];
                    //     const batchEvents: EventBatch[] = [
                    //         {
                    //             actions: keyboardActions,
                    //             mutatedElements: new Set([text]),
                    //         },
                    //     ];
                    //     expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                // todo: Test long keypress on a key on mac. It should not trigger many keys if
                //       nothing has changed in the document
                // todo: Test when mac (only safari?) trigger insert "insertReplacementText" or
                //       "insertText"
            });

            describe('completion/correction', () => {
                it('should add space when hitting a word completion (SwiftKey)', async () => {
                    ctx.editable.innerHTML = '<p>a hello</p>';
                    const p = document.querySelector('p');
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

                    const virtualkeyboardActions: NormalizedAction[] = [
                        {
                            text: ' ',
                            type: 'insertText',
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            actions: virtualkeyboardActions,
                            mutatedElements: new Set([text]),
                        },
                    ];
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
                it('should add space from auto-correction (SwiftKey)', async () => {
                    ctx.editable.innerHTML = '<p>a hillo</p>';
                    const p = document.querySelector('p');
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
                    const normalizedActions: NormalizedAction[] = [
                        {
                            type: 'setSelection',
                            domSelection: {
                                anchorNode: text,
                                anchorOffset: 2,
                                focusNode: text,
                                focusOffset: 7,
                                direction: Direction.FORWARD,
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
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: normalizedActions,
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

                    const batchEvents: EventBatch[] = [];
                    expect(ctx.eventBatches).to.deep.equal(batchEvents);
                });
            });

            describe('backspace/delete', () => {
                describe('backspace', () => {
                    describe('deleteContentBackward one letter', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');
                            text = p.childNodes[0];
                            setRange(text, 5, text, 5);
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteContent',
                                    direction: Direction.BACKWARD,
                                },
                            ];
                        });
                        it('should deleteContentBackward one letter (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 15 },
                                        'anchor': { 'nodeId': 2, 'offset': 15 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward at the end of word', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');
                            text = p.childNodes[0];
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'world',
                                },
                            ];
                        });
                        it('deleteWordBackward at the end of word (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 16 },
                                        'anchor': { 'nodeId': 2, 'offset': 16 },
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
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 11 },
                                        'anchor': { 'nodeId': 2, 'offset': 11 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // GBoard does not provide a way to delete a word with
                        // deleteWordBackward nor deleteWordBackward.
                    });
                    describe('deleteWordBackward or deleteContentBackward word in middle of sentence', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');
                            text = p.childNodes[0];
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'hello',
                                },
                            ];
                        });

                        it('deleteWordBackward word in middle of sentence (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward word in middle of sentence with style', () => {
                        let keyboardActions: NormalizedAction[];
                        let macFireforxKeyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let lastText: ChildNode;
                        let b: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworldStyled;
                            p = document.querySelector('p');
                            lastText = p.lastChild;
                            b = document.querySelector('b');
                            setRange(lastText, 0, lastText, 0);
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'hello',
                                },
                            ];
                            macFireforxKeyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'hello ',
                                },
                            ];
                        });

                        it('deleteWordBackward word in middle of sentence with style (ubuntu chrome)', async () => {
                            // todo: document this for all tests
                            // <p>Hey, <b>hello[]</b> world</p>
                            // ctrl + backspace
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 4, 'offset': 5 },
                                        'anchor': { 'nodeId': 4, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 4, 'offset': 5 },
                                        'anchor': { 'nodeId': 4, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 4, 'offset': 5 },
                                        'anchor': { 'nodeId': 4, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 6 }],
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 4, 'offset': 5 },
                                        'anchor': { 'nodeId': 4, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 5, 'offset': 1 },
                                        'anchor': { 'nodeId': 5, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': 'world',
                                        'targetId': 5,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: macFireforxKeyboardActions,
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
                                        'focus': { 'nodeId': 4, 'offset': 5 },
                                        'anchor': { 'nodeId': 4, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteWordBackward or deleteContentBackward multi-styled word', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let lastText: ChildNode;
                        let b: ChildNode;
                        let bChild0: ChildNode;
                        let bChild1: ChildNode;
                        let bChild2: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworldMutlistyled;
                            p = document.querySelector('p');
                            lastText = p.lastChild;
                            b = p.childNodes[1];
                            bChild0 = b.childNodes[0];
                            bChild1 = b.childNodes[1];
                            bChild2 = b.childNodes[2];

                            setRange(lastText, 1, lastText, 1);
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.BACKWARD,
                                    text: 'hello',
                                },
                            ];
                        });

                        it('deleteWordBackward multi-styled word (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 7, 'offset': 1 },
                                        'anchor': { 'nodeId': 7, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': ' world',
                                        'targetId': 8,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 7, 'offset': 1 },
                                        'anchor': { 'nodeId': 7, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 4 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'childList',
                                        'textContent': '',
                                        'targetId': 3,
                                        'removedNodes': [{ 'nodeId': 5 }],
                                    },
                                    {
                                        'type': 'mutation',
                                        'mutationType': 'characterData',
                                        'textContent': '',
                                        'targetId': 7,
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 7, 'offset': 1 },
                                        'anchor': { 'nodeId': 7, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 9 }],
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 7, 'offset': 1 },
                                        'anchor': { 'nodeId': 7, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'removedNodes': [{ 'nodeId': 9 }],
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 8, 'offset': 0 },
                                        'anchor': { 'nodeId': 8, 'offset': 0 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 7, 'offset': 1 },
                                        'anchor': { 'nodeId': 7, 'offset': 1 },
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
                                        'removedNodes': [{ 'nodeId': 3 }],
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([b, lastText]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('deleteHardLineBackward or deleteSoftLineBackward', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');
                            text = p.firstChild;
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteHardLine',
                                    direction: Direction.BACKWARD,
                                    domSelection: {
                                        anchorNode: text,
                                        anchorOffset: 0,
                                        focusNode: text,
                                        focusOffset: 10,
                                        direction: Direction.BACKWARD,
                                    },
                                },
                            ];
                        });
                        it('deleteHardLineBackward (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 0 },
                                        'anchor': { 'nodeId': 2, 'offset': 0 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 0 },
                                        'anchor': { 'nodeId': 2, 'offset': 0 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Meta', 'code': 'MetaLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 10 },
                                        'anchor': { 'nodeId': 2, 'offset': 10 },
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
                                        'focus': { 'nodeId': 2, 'offset': 0 },
                                        'anchor': { 'nodeId': 2, 'offset': 0 },
                                    },
                                ],
                                [{ 'type': 'keyup', 'key': 'Meta', 'code': 'OSLeft' }],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'deleteContent',
                                direction: Direction.BACKWARD,
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
                                mutatedElements: new Set([text]),
                            },
                        ];
                        expect(ctx.eventBatches).to.deep.equal(batchEvents);
                    });
                });

                describe('delete', () => {
                    describe('deleteContentForward with delete', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');
                            text = p.childNodes[0];
                            setRange(text, 4, text, 4);
                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteContent',
                                    direction: Direction.FORWARD,
                                },
                            ];
                        });
                        it('should deleteContentForward with delete (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                    actions: keyboardActions,
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
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('delete word in the middle of a sentence', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text2: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');

                            text2 = p.childNodes[0];
                            // setRange(text2, 2, text2, 2);

                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteWord',
                                    direction: Direction.FORWARD,
                                    text: 'hello',
                                },
                            ];
                        });
                        it('delete word in the middle of a sentence (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
                                    },
                                ],
                            ]);

                            const batchEvents: EventBatch[] = [
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text2]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                    });
                    describe('delete whole line forward', () => {
                        let keyboardActions: NormalizedAction[];
                        let p: HTMLElement;
                        let text: ChildNode;

                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;
                            p = document.querySelector('p');

                            text = p.childNodes[0];
                            setRange(text, 2, text, 2);

                            await nextTick();
                            ctx.eventBatches.splice(0);

                            keyboardActions = [
                                {
                                    type: 'deleteHardLine',
                                    direction: Direction.FORWARD,
                                    domSelection: {
                                        anchorNode: text,
                                        anchorOffset: 5,
                                        focusNode: text,
                                        focusOffset: 16,
                                        direction: Direction.FORWARD,
                                    },
                                },
                            ];
                        });
                        it('delete whole line forward (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
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
                                        'focus': { 'nodeId': 2, 'offset': 5 },
                                        'anchor': { 'nodeId': 2, 'offset': 5 },
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
                                {
                                    actions: keyboardActions,
                                    mutatedElements: new Set([text]),
                                },
                            ];
                            expect(ctx.eventBatches).to.deep.equal(batchEvents);
                        });
                        // impossible to delete the whole line forward in mac
                    });
                    describe('delete whole line forward and do nothing', () => {
                        beforeEach(async () => {
                            ctx.editable.innerHTML = testContentNormalizer.helloworld;

                            ctx.eventBatches.splice(0);
                        });
                        it('delete whole line forward and do nothing (ubuntu chrome)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 4, 'offset': 12 },
                                        'anchor': { 'nodeId': 4, 'offset': 12 },
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

                            expect(ctx.eventBatches).to.deep.equal([]);
                        });
                        it('delete whole line forward and do nothing (ubuntu firefox)', async () => {
                            await triggerEvents([
                                [
                                    {
                                        'type': 'selection',
                                        'focus': { 'nodeId': 4, 'offset': 12 },
                                        'anchor': { 'nodeId': 4, 'offset': 12 },
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

                            expect(ctx.eventBatches).to.deep.equal([]);
                        });
                        // impossible to delete the whole line forward in mac
                    });
                });
            });

            describe('enter', () => {
                describe('enter in the middle of the word', () => {
                    let keyboardActions: NormalizedAction[];

                    beforeEach(async () => {
                        await nextTick();
                        ctx.eventBatches.splice(0);

                        keyboardActions = [
                            {
                                type: 'insertParagraphBreak',
                            },
                        ];
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
                                actions: keyboardActions,
                                mutatedElements: new Set([newText, text, newP]),
                            },
                        ];
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

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'insertParagraphBreak',
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'insertParagraphBreak',
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'insertParagraphBreak',
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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

                        const keyboardActions: NormalizedAction[] = [
                            {
                                type: 'insertText',
                                text: '\n',
                                html: '<br/>',
                            },
                        ];

                        const batchEvents: EventBatch[] = [
                            {
                                actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'setSelection',
                            domSelection: {
                                anchorNode: text,
                                anchorOffset: 3,
                                focusNode: text,
                                focusOffset: 3,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'setSelection',
                            domSelection: {
                                anchorNode: ctx.editable,
                                anchorOffset: 0,
                                focusNode: ctx.editable,
                                focusOffset: 0,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'setSelection',
                            domSelection: {
                                anchorNode: text,
                                anchorOffset: 4,
                                focusNode: text,
                                focusOffset: 3,
                                direction: Direction.BACKWARD,
                            },
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'setSelection',
                            domSelection: {
                                anchorNode: text,
                                anchorOffset: 3,
                                focusNode: text,
                                focusOffset: 5,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'selectAll',
                            carretPosition: {
                                offsetNode: ctx.editable.childNodes[1].firstChild,
                                offset: 1,
                            },
                            domSelection: {
                                anchorNode: ctx.editable.firstChild.firstChild,
                                anchorOffset: 0,
                                focusNode: ctx.editable.lastChild.lastChild,
                                focusOffset: 1,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'selectAll',
                            carretPosition: {
                                offsetNode: ctx.editable.childNodes[1].firstChild,
                                offset: 1,
                            },
                            domSelection: {
                                anchorNode: ctx.editable.firstChild.firstChild,
                                anchorOffset: 0,
                                focusNode: ctx.editable.lastChild.lastChild.previousSibling,
                                focusOffset: 0,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            type: 'selectAll',
                            carretPosition: {
                                offsetNode: ctx.editable.childNodes[1].firstChild,
                                offset: 1,
                            },
                            domSelection: {
                                anchorNode: ctx.editable.firstChild.firstChild,
                                anchorOffset: 0,
                                focusNode: ctx.editable.lastChild.lastChild,
                                focusOffset: 1,
                                direction: Direction.FORWARD,
                            },
                        },
                    ];
                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            direction: Direction.FORWARD,
                            type: 'deleteContent',
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            html: '<div>b</div>',
                            text: 'b',
                            type: 'insertHtml',
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [{ type: 'historyUndo' }];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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

                    const keyboardActions: NormalizedAction[] = [
                        {
                            format: 'bold',
                            type: 'applyFormat',
                            data: null,
                        },
                    ];

                    const batchEvents: EventBatch[] = [
                        {
                            actions: keyboardActions,
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
