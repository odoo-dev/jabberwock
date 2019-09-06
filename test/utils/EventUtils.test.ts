import { getEventType, _triggerTextInput, triggerEvents, nextTick } from './EventUtils';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('EventUtils', () => {
    describe('getEventType()', () => {
        it('should return the correct value', () => {
            expect(getEventType('click')).to.equal('mouse');
            expect(getEventType('key')).to.equal('keyboard');
            expect(getEventType('none')).to.equal(undefined);
        });
    });

    describe('triggerEvents()', () => {
        it('should trigger a keypress "i"', async function() {
            const callback = sinon.fake();
            const mainCallback = function(ev): void {
                console.log('mainCallback called', ev);
                callback(ev);
            };
            document.body.addEventListener('keypress', mainCallback);
            document.body.setAttribute('contenteditable', 'true');
            triggerEvents(document.body, [
                {
                    nativeEventType: 'keypress',
                    key: 'i',
                    charCode: 0,
                    keyCode: 73,
                },
            ]);
            await nextTick();
            expect(callback.callCount).to.equal(1);
        });
        it('should trigger an "insertText"', async function() {});
        it('should trigger a "textInput"', async function() {});
    });

    // describe('_triggerTextInput()', () => {
    //     it('should trigger ', () => {});
    // });
});
