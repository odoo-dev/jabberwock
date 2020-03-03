/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { EventBatch, NormalizedAction } from '../src/EventNormalizer';
import {
    testCallbackAfter,
    TestContext,
    setSelection,
    nextTick,
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
        beforeEach(() => {
            ctx.eventBatches.splice(0);
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

            it('should not selectAll', async () => {
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
        });
    });
});
