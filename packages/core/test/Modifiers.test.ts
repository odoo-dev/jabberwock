import { Modifiers } from '../src/Modifiers';
import { Modifier } from '../src/Modifier';
import { expect } from 'chai';

function id<T>(x: T): T {
    return x;
}
describe('core', () => {
    describe('Modifiers', () => {
        describe('prepend()', () => {
            it('should prepend multiples modifier in proper order', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const m4 = new Modifier();
                modifiers.prepend(m1, m2, m3, m4);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap[0]).to.equal(m1);
                expect(modifiersMap[1]).to.equal(m2);
                expect(modifiersMap[2]).to.equal(m3);
                expect(modifiersMap[3]).to.equal(m4);
            });
        });
        describe('set()', () => {
            it('should replace one modifier and append the other', () => {
                class Modifier1 extends Modifier {}
                class Modifier2 extends Modifier {}
                const m1a = new Modifier1();
                const m1b = new Modifier1();
                const m2 = new Modifier2();
                const modifiers1 = new Modifiers(m1a, m2);
                modifiers1.set(m1b);
                const allModifiers = modifiers1.filter(() => true);
                expect(allModifiers.length).to.eql(2);
                expect(allModifiers[0]).to.eql(m1b);
                expect(allModifiers[1]).to.eql(m2);
            });
        });
    });
});
