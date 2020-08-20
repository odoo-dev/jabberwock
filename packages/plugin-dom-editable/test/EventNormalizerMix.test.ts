import { triggerEvents } from './eventNormalizerUtils';
/* eslint-disable max-nested-callbacks */
import {
    testCallbackAfter,
    testCallbackBefore,
    testContentNormalizer,
    TestContext,
} from './eventNormalizerUtils';

// document.addEventListener('keydown', e => {
//     const o = { button: e.button, detail: e.detail, clientX: e.clientX, clientY: e.clientY };
//     console.log('e.target:', e.target);
//     console.log('up o:', o);
// });

// interface ClickAndSelectParams {
//     clickTarget: Node | Element;
//     x: number;
//     y: number;
//     selectionTargetStart: Node;
//     selectionTargetEnd: Node;
//     selectionOffsetStart: number;
//     selectionOffsetEnd: number;
// }

// function clickAndSelect(params: ClickAndSelectParams) {
//     triggerEvent(params.clickTarget, 'mousedown', {
//         button: 0,
//         detail: 1,
//         clientX: params.x,
//         clientY: params.y,
//     });
//     setSelection(
//         params.selectionTargetStart,
//         params.selectionOffsetStart,
//         params.selectionTargetEnd,
//         params.selectionOffsetEnd,
//     );
//     triggerEvent(params.clickTarget, 'click', {
//         button: 0,
//         detail: 1,
//         clientX: params.x,
//         clientY: params.y,
//     });
//     triggerEvent(params.clickTarget, 'mouseup', {
//         button: 0,
//         detail: 1,
//         clientX: params.x,
//         clientY: params.y,
//     });
// }

describe('utils', () => {
    describe('EventNormalizer', () => {
        let ctx: TestContext;

        before(() => {
            ctx = testCallbackBefore();
        });
        after(() => {
            testCallbackAfter(ctx);
        });
        describe('mixed', () => {
            it('external command change the range in the middle of a sequence', async () => {});
        });

        describe('concurency', () => {
            it('click + click + letter + external command + click + external command + letter', async () => {
                ctx.editable.innerHTML = testContentNormalizer.helloworld;
                const p = document.querySelector('p');
                const text = p.childNodes[0];
                const text2 = p.childNodes[2];

                triggerEvents(
                    [
                        [
                            {
                                'type': 'mousedown',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 26,
                            },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 2, 'offset': 0 },
                                'anchor': { 'nodeId': 2, 'offset': 0 },
                            },
                        ],
                        [
                            {
                                'type': 'mouseup',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 26,
                            },
                            {
                                'type': 'click',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 26,
                            },
                        ],
                        [
                            {
                                'type': 'mousedown',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 46,
                            },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 4, 'offset': 0 },
                                'anchor': { 'nodeId': 4, 'offset': 0 },
                            },
                        ],
                        [
                            {
                                'type': 'mouseup',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 46,
                            },
                            {
                                'type': 'click',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 1,
                                'clientY': 46,
                            },
                        ],
                        [
                            { 'type': 'keydown', 'key': 'a', 'code': 'KeyA' },
                            { 'type': 'keypress', 'key': 'a', 'code': 'KeyA' },
                            { 'type': 'beforeinput', 'data': 'a', 'inputType': 'insertText' },
                            { 'type': 'input', 'data': 'a', 'inputType': 'insertText' },
                            {
                                'type': 'mutation',
                                'mutationType': 'characterData',
                                'textContent': 'aHillo world.',
                                'targetId': 4,
                            },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 4, 'offset': 1 },
                                'anchor': { 'nodeId': 4, 'offset': 1 },
                            },
                        ],
                        [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyA' }],
                    ],
                    true,
                );

                // external Command
                ctx.normalizer.signalPostExternalEvent();

                triggerEvents(
                    [
                        [
                            {
                                'type': 'mousedown',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 2,
                                'clientY': 27,
                            },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 2, 'offset': 0 },
                                'anchor': { 'nodeId': 2, 'offset': 0 },
                            },
                        ],
                        [
                            {
                                'type': 'mouseup',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 2,
                                'clientY': 27,
                            },
                            {
                                'type': 'click',
                                'targetId': 1,
                                'button': 0,
                                'detail': 1,
                                'clientX': 2,
                                'clientY': 27,
                            },
                        ],
                    ],
                    true,
                );

                // external command

                triggerEvents(
                    [
                        [
                            { 'type': 'keydown', 'key': 'a', 'code': 'KeyA' },
                            { 'type': 'keypress', 'key': 'a', 'code': 'KeyA' },
                            { 'type': 'beforeinput', 'data': 'a', 'inputType': 'insertText' },
                            { 'type': 'input', 'data': 'a', 'inputType': 'insertText' },
                            {
                                'type': 'mutation',
                                'mutationType': 'characterData',
                                'textContent': 'aHey, hello world',
                                'targetId': 2,
                            },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 2, 'offset': 1 },
                                'anchor': { 'nodeId': 2, 'offset': 1 },
                            },
                        ],
                        [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyA' }],
                    ],
                    true,
                );
            });
            it('click + mousemove + letter + external command + click + mousemove + external command + letter', async () => {});

            it('letter + scroll + click + letter', async () => {});

            it('should event "ArrowRight + letter" = setSelection + insert', async () => {});
            it('should event "letter + ArrowRight + letter" = insert + setSelection + insert', async () => {});
        });
    });
});
