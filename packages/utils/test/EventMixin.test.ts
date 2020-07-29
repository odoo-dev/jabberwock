import { fake } from 'sinon';
import { expect } from 'chai';
import { EventMixin } from '../src/EventMixin';
describe('utils', () => {
    describe('EventMixin', () => {
        it('should register and fire one callback', async () => {
            const event = new EventMixin();
            const callback = fake();
            await event.on('event', callback);
            await event.trigger('event');
            expect(event._eventCallbacks).to.deep.equal({ event: [callback] });
            expect(callback.callCount).to.equal(1);
        });
        it('should register and fire multiples callback', async () => {
            const event = new EventMixin();
            const callback1 = fake();
            const callback2 = fake();
            await event.on('event', callback1);
            await event.on('event', callback2);
            await event.trigger('event');
            expect(event._eventCallbacks).to.deep.equal({ event: [callback1, callback2] });
            expect(callback1.callCount).to.equal(1);
            expect(callback2.callCount).to.equal(1);
        });

        it('should register and fire one callback with arguments', async () => {
            const event = new EventMixin();
            const callback = fake();
            await event.on('event', callback);
            await event.trigger('event', 'arg');
            expect(callback.args[0].length).to.equal(1);
            expect(callback.args[0][0]).to.equal('arg');
        });
        describe('off()', () => {
            it('should unbind all callback', async () => {
                const event = new EventMixin();
                const callback1 = fake();
                const callback2 = fake();
                await event.on('event', callback1);
                await event.on('event', callback2);
                await event.off('event');
                await event.trigger('event');
                expect(callback1.callCount).to.equal(0);
                expect(callback2.callCount).to.equal(0);
            });
            it('should unbind a specific callback', async () => {
                const event = new EventMixin();
                const callback1 = fake();
                const callback2 = fake();
                await event.on('event', callback1);
                await event.on('event', callback2);
                await event.off('event', callback2);
                await event.trigger('event');
                expect(callback1.callCount).to.equal(1);
                expect(callback2.callCount).to.equal(0);
            });
        });
    });
});
