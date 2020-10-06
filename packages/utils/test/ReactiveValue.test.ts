import { fake } from 'sinon';
import { expect } from 'chai';
import { ReactiveValue } from '../src/ReactiveValue';
describe('utils', () => {
    describe('ReactiveValue', () => {
        it('should set/get a value and fire', () => {
            const reactiveValue = new ReactiveValue('');
            const fakeCallback = fake();
            reactiveValue.on('set', fakeCallback);
            reactiveValue.set('a');
            expect(reactiveValue.get()).to.equal('a');
            expect(fakeCallback.callCount).to.equal(1);
        });
        it('should set/get a value without firing', () => {
            const reactiveValue = new ReactiveValue('');
            const fakeCallback = fake();
            reactiveValue.on('set', fakeCallback);
            reactiveValue.set('a', false);
            expect(reactiveValue.get()).to.equal('a');
            expect(fakeCallback.callCount).to.equal(0);
        });
    });
});
