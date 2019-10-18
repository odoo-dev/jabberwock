import { expect } from 'chai';
import { CRDT } from '../../../src/core/utils/CRDT';

describe('LSEQ', () => {
    const base = Math.pow(2, 4);

    describe('alloc()', () => {
        /**
         * How to read the following tests titles:
         *
         * The line:
         * `alloc([1, 2], [1, 4]) +1 => [1, 3]`
         *
         * Mean:
         * Instruction `alloc([1, 2], 1, 4)`, with a random generating `1` and the
         * strategy `boundary+` will return `[1, 4]`.
         */

        it.skip('insert a char before the previously generated, 100 times', () => {
            const crdt = new CRDT();
            let previousID = [2];
            for (let i = 0; i < 100; i++) {
                previousID = crdt.alloc([1], previousID);
            }
        });
        it('alloc([1, 2], [1, 4]) +1 => [1, 3]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 0;
            crdt.random.boolean = (): boolean => true;
            const id1 = [1, 2];
            const id2 = [1, 4];
            expect(crdt.alloc(id1, id2)).to.eql([1, 3]);
        });
        it('alloc([1, 2], [1, 3]) +1 => [1, 2, 1]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 0;
            crdt.random.boolean = (): boolean => true;
            const id1 = [1, 2];
            const id2 = [1, 3];
            expect(crdt.alloc(id1, id2)).to.eql([1, 2, 1]);
        });
        it('alloc([0, 0, 0, 0], [1, 0, 0, 1]) -2 => [0, 31]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 1;
            crdt.random.boolean = (): boolean => false;
            const id1 = [0, 0, 0, 0];
            const id2 = [1, 0, 0, 1];
            expect(crdt.alloc(id1, id2)).to.eql([0, 31]);
        });
        it('alloc([1, 0, 0, 0], [1, 0, 0, 1]) -2 => [1, 0, 0, 0, 255]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 1;
            crdt.random.boolean = (): boolean => false;
            const id1 = [1, 0, 0, 0];
            const id2 = [1, 0, 0, 1];
            expect(crdt.alloc(id1, id2)).to.eql([1, 0, 0, 0, 255]);
        });
        it('alloc([1], [1, 1]) +9 => [1, 0, 10]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 9;
            crdt.random.boolean = (): boolean => true;
            const id1 = [1];
            const id2 = [1, 1];
            expect(crdt.alloc(id1, id2)).to.eql([1, 0, 10]);
        });
        it('alloc([1], [2]), +10 => [1, 10]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 9;
            crdt.random.boolean = (): boolean => true;
            const id1 = [1];
            const id2 = [2];
            expect(crdt.alloc(id1, id2)).to.eql([1, 10]);
        });
        it('alloc([1], [2]), -9 => [1, 23]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 9;
            crdt.random.boolean = (): boolean => false;
            const id1 = [1];
            const id2 = [2];
            expect(crdt.alloc(id1, id2)).to.eql([1, 23]);
        });
        it('alloc([1], [1, 2]), -2 => [1, 1]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 0;
            crdt.random.boolean = (): boolean => false;
            const id1 = [1];
            const id2 = [1, 2];
            expect(crdt.alloc(id1, id2)).to.eql([1, 1]);
        });
        it('alloc([1], [1, 1]), -10 => [1, 0, 55]', () => {
            const crdt = new CRDT();
            crdt.random.range = (): number => 9;
            crdt.random.boolean = (): boolean => false;
            const id1 = [1];
            const id2 = [1, 1];
            expect(crdt.alloc(id1, id2)).to.eql([1, 0, 55]);
        });
    });
    describe('getInterval()', () => {
        it('get distance between depth 1 if ID has depth 1', () => {
            const crdt = new CRDT();
            const id1 = [1];
            const id2 = [2];
            expect(crdt.getInterval(1, id1, id2)).to.equal(1);
        });
        it('get distance between depth 1 if ID has depth 2', () => {
            const crdt = new CRDT();
            const id1 = [1, 1];
            const id2 = [2, 1];
            expect(crdt.getInterval(2, id1, id2)).to.equal(base);
        });
    });
    describe('getPosition()', () => {
        const crdt = new CRDT();
        it('with an id of depth 1', () => {
            const id = [2];
            expect(crdt.getPosition(id, 1)).to.equal(id[0]);
        });
        it('with an id of depth 2', () => {
            const crdt = new CRDT();
            const id = [2, 2];
            expect(crdt.getPosition(id, 2)).to.equal(id[0] * base + id[1]);
        });
        it('with an id of depth 3', () => {
            const crdt = new CRDT();
            const id = [2, 2, 2];
            expect(crdt.getPosition(id, 3)).to.equal(id[0] * base + id[1] * base * 2 + id[2]);
        });
    });
    describe('substractID()', () => {
        it('should substract without depth', () => {
            const crdt = new CRDT();
            const id = [1, 0, 1, 0, 0];
            crdt.substractID(id, id.length - 1);
            expect(id).to.eql([1, 0, 0, 128, 256]);
        });
        it('should substract 10', () => {
            const crdt = new CRDT();
            const id = [2, 0];
            crdt.substractID(id, id.length - 1, 10);
            expect(id).to.eql([1, 22]);
        });
    });
    describe('prefix()', () => {
        it('should prefix', () => {
            const crdt = new CRDT();
            expect(crdt.prefix([0, 1], 3)).to.eql([0, 1, 0]);
        });
        it('should not prefix', () => {
            const crdt = new CRDT();
            expect(crdt.prefix([0, 1], 2)).to.eql([0, 1]);
        });
    });
});
