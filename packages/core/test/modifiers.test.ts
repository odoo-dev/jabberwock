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
    });
});
