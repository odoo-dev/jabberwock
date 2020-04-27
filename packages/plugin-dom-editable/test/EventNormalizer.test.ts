/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { Direction } from '../../core/src/VSelection';
import { EventBatch, NormalizedAction, ModifierKeys } from '../src/EventNormalizer';
import {
    testCallbackAfter,
    TestContext,
    setSelection,
    nextTick,
    testCallbackBefore,
} from './eventNormalizerUtils';

export const defaultModifierKeys: ModifierKeys = {
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
};

describe('utils', () => {
    describe('EventNormalizer', () => {
        let ctx: TestContext;

        before(() => {
            ctx = testCallbackBefore();
        });
        after(() => {
            testCallbackAfter(ctx);
        });
        beforeEach(() => {
            ctx.eventBatches.splice(0);
        });

        describe('_inferKeydownEvent', () => {
            it('should infer Enter from insertParagraph', () => {
                expect(
                    ctx.normalizer._inferKeydownEvent({
                        inputType: 'insertParagraph',
                    } as InputEvent),
                ).to.deep.equal({ ...defaultModifierKeys, key: 'Enter', code: 'Enter' });
            });
            it('should infer Backspace from deleteContentBackward', () => {
                expect(
                    ctx.normalizer._inferKeydownEvent({
                        inputType: 'deleteContentBackward',
                    } as InputEvent),
                ).to.deep.equal({ ...defaultModifierKeys, key: 'Backspace', code: 'Backspace' });
            });
            it('should infer Delete from deleteContentForward', () => {
                expect(
                    ctx.normalizer._inferKeydownEvent({
                        inputType: 'deleteContentForward',
                    } as InputEvent),
                ).to.deep.equal({ ...defaultModifierKeys, key: 'Delete', code: 'Delete' });
            });
            it('should not infer anything', () => {
                expect(ctx.normalizer._inferKeydownEvent({ inputType: '' } as InputEvent)).to.be
                    .undefined;
            });
        });

        describe('_isAtVisibleEdge', () => {
            let divOutside;
            before(() => {
                divOutside = document.createElement('div');
                document.body.appendChild(divOutside);
            });
            after(() => {
                document.body.removeChild(divOutside);
            });

            it('should not be at visible edge', () => {
                const isAtVisibleEdge = ctx.normalizer._isAtVisibleEdge(divOutside, 'start');
                expect(isAtVisibleEdge).to.be.false;
            });
        });
        describe('_isSelectAll', () => {
            it('should selectAll', async () => {
                ctx.editable.innerHTML = '<div>ab</div><div>cd</div>';
                const abTextNode = ctx.editable.childNodes[0].childNodes[0];
                const cdTextNode = ctx.editable.childNodes[1].childNodes[0];
                ctx.normalizer._initialCaretPosition = { offsetNode: abTextNode, offset: 1 };
                ctx.normalizer._followsPointerAction = true;
                setSelection(abTextNode, 0, cdTextNode, 2);
                await nextTick();
                await nextTick();

                const keyboardActions: NormalizedAction[] = [
                    {
                        type: 'selectAll',
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

            it('should not selectAll for all selection forward that does not select all', async () => {
                ctx.editable.innerHTML = '<div>ab</div><div>cd</div>';
                const abTextNode = ctx.editable.childNodes[0].childNodes[0];
                const cdTextNode = ctx.editable.childNodes[1].childNodes[0];
                ctx.normalizer._initialCaretPosition = { offsetNode: abTextNode, offset: 1 };
                ctx.normalizer._followsPointerAction = true;
                for (let x = 0; x <= 2; x++) {
                    for (let y = 0; y <= 2; y++) {
                        if (x === 0 && y === 2) {
                            break;
                        }
                        setSelection(abTextNode, x, cdTextNode, y);
                        await nextTick();
                        await nextTick();
                    }
                }

                const batchEvents: EventBatch[] = [];
                expect(ctx.eventBatches).to.deep.equal(batchEvents);
            });
            it('should not selectAll for direction backward', async () => {
                ctx.editable.innerHTML = '<div>ab</div><div>cd</div>';
                const abTextNode = ctx.editable.childNodes[0].childNodes[0];
                const cdTextNode = ctx.editable.childNodes[1].childNodes[0];
                const isSelectAll = ctx.normalizer._isSelectAll({
                    anchorNode: cdTextNode,
                    anchorOffset: 2,
                    focusNode: abTextNode,
                    focusOffset: 0,
                    direction: Direction.BACKWARD,
                });
                expect(isSelectAll).to.be.false;
            });
        });
    });
});
