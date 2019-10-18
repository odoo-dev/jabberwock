import { expect } from 'chai';
import { Random } from '../../../src/Random';

describe('Random', () => {
    describe('seed()', () => {
        it('must be different when executed twice', () => {
            const random = new Random(1);
            expect(random.seed()).to.not.equal(random.seed());
        });
    });
    describe('random()', () => {
        it('must be different when executed twice', () => {
            const random = new Random(1);
            expect(random.random()).to.not.equal(random.random());
        });
    });
    describe('range()', () => {
        it('must always return a 1 (included) < value < 3 (excluded)', () => {
            const random = new Random(1);
            for (let i; i < 100; i++) {
                const val = random.range(1, 3);
                expect(val).to.be.at.least(1);
                expect(val).to.be.below(3);
            }
        });
    });
});
