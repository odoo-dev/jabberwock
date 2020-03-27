import { fake } from 'sinon';
import { expect } from 'chai';
import { VEvent } from '../src/VEvent';
describe('utils', () => {
    describe('VEvent', () => {
        it('should register and fire one callback', async () => {
            const event = new VEvent();
            const callback = fake();
            await event.on('event', callback);
            await event.fire('event');
            expect(event._eventCallbacks).to.deep.equal({ event: [callback] });
            expect(callback.callCount).to.equal(1);
        });
        it('should register and fire multiples callback', async () => {
            const event = new VEvent();
            const callback1 = fake();
            const callback2 = fake();
            await event.on('event', callback1);
            await event.on('event', callback2);
            await event.fire('event');
            expect(event._eventCallbacks).to.deep.equal({ event: [callback1, callback2] });
            expect(callback1.callCount).to.equal(1);
            expect(callback2.callCount).to.equal(1);
        });

        it('should register and fire one callback with arguments', async () => {
            const event = new VEvent();
            const callback = fake();
            await event.on('event', callback);
            await event.fire('event', 'arg');
            expect(callback.args[0].length).to.equal(1);
            expect(callback.args[0][0]).to.equal('arg');
        });

        it('should trigger object on cascade', async () => {
            const parent = new VEvent();
            const child = new VEvent();
            child.parent = parent;
            const callback = fake();
            parent.on('event', callback);
            await child.fire('event');
            expect(callback.callCount).to.equal(1);
        });
    });
});
