import { Modifiers } from '../src/Modifiers';
import { CascadingMixin, Modifier } from '../src/Modifier';
import { expect } from 'chai';

function id<T>(x: T): T {
    return x;
}
class ExtendedModifier extends Modifier {
    constructor(public value: number = 0) {
        super();
    }
    clone(): this {
        const clone = super.clone();
        clone.value = this.value;
        return clone;
    }
    isSameAs(otherModifier: Modifier): boolean {
        return otherModifier instanceof ExtendedModifier && this.value === otherModifier.value;
    }
}
describe('core', () => {
    describe('Modifiers', () => {
        describe('constructor()', () => {
            it('should create an empty Modifiers instance', () => {
                const modifiers = new Modifiers();
                expect(modifiers instanceof Modifiers).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([]);
            });
            it('should create a Modifiers instance from an array of modifiers', () => {
                const modifier1 = new Modifier();
                const modifier2 = new Modifier();
                const modifiers = new Modifiers(modifier1, modifier2);
                expect(modifiers instanceof Modifiers).to.be.true;
                // Should clone the modifiers, not append them as is.
                expect(modifiers.find(modifier1)).to.be.undefined;
                expect(modifiers.find(modifier2)).to.be.undefined;
                // Should have added the two modifiers.
                expect(modifiers.length).to.equal(2);
                expect(modifiers.filter(Modifier).length).to.equal(2);
            });
            it('should create a Modifiers instance from an array of modifiers', () => {
                const modifiers = new Modifiers(Modifier, Modifier);
                expect(modifiers instanceof Modifiers).to.be.true;
                // Should have added the two modifiers.
                expect(modifiers.length).to.equal(2);
                expect(modifiers.filter(Modifier).length).to.equal(2);
            });
        });
        describe('length', () => {
            it('should update the length appropriately', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                modifiers.append(new Modifier());
                expect(modifiers.length).to.equal(1);
            });
        });
        describe('clone()', () => {
            it('should clone an empty Modifiers instance', () => {
                const modifiers = new Modifiers();
                const clone = modifiers.clone();
                expect(clone instanceof Modifiers).to.be.true;
                expect(clone.length).to.equal(0);
                expect(modifiers).not.to.equal(clone);
            });
            it('should clone a populated Modifiers instance', () => {
                const modifier1 = new Modifier();
                const modifier2 = new Modifier();
                const modifiers = new Modifiers();
                modifiers.append(modifier1, modifier2);
                const clone = modifiers.clone();
                expect(modifiers instanceof Modifiers).to.be.true;
                expect(modifiers).not.to.equal(clone);
                // Should clone the modifiers, not append them as is.
                expect(modifiers.find(modifier1)).to.equal(modifier1);
                expect(modifiers.find(modifier2)).to.equal(modifier2);
                expect(clone.find(modifier1)).to.be.undefined;
                expect(clone.find(modifier2)).to.be.undefined;
                // Should have added the two modifiers.
                expect(clone.length).to.equal(2);
                expect(clone.filter(Modifier).length).to.equal(2);
                // Should add in one, not in the other.
                modifiers.append(Modifier);
                expect(modifiers.length).to.equal(3);
                expect(clone.length).to.equal(2);
            });
        });
        describe('append()', () => {
            it('should append a modifier instance', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                const modifier = new Modifier();
                modifiers.append(modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.map(id)).to.deep.equal([modifier]);
                const extendedModifier = new ExtendedModifier();
                modifiers.append(extendedModifier);
                expect(modifiers.length).to.equal(2);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap).to.deep.equal([modifier, extendedModifier]);
                expect(modifiersMap[0]).to.equal(modifier);
                expect(modifiersMap[1]).to.equal(extendedModifier);
            });
            it('should append a modifier and instantiate it', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                modifiers.append(Modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.find(Modifier) instanceof Modifier).to.equal(true);
                modifiers.append(ExtendedModifier);
                expect(modifiers.length).to.equal(2);
                expect(modifiers.find(ExtendedModifier) instanceof ExtendedModifier).to.equal(true);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap[0] instanceof Modifier).to.be.true;
                expect(modifiersMap[0] instanceof ExtendedModifier).to.be.false;
                expect(modifiersMap[1] instanceof ExtendedModifier).to.be.true;
            });
            it('should append multiple modifiers in proper order', () => {
                const modifiers = new Modifiers(Modifier);
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const m4 = new Modifier();
                modifiers.append(m1, m2, m3, m4);
                const modifiersMap = modifiers.map(id);
                expect(modifiers.length).to.equal(5);
                expect(modifiersMap[1]).to.equal(m1);
                expect(modifiersMap[2]).to.equal(m2);
                expect(modifiersMap[3]).to.equal(m3);
                expect(modifiersMap[4]).to.equal(m4);
            });
        });
        describe('prepend()', () => {
            it('should prepend a modifier instance', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                const modifier = new Modifier();
                modifiers.prepend(modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.map(id)).to.deep.equal([modifier]);
                const extendedModifier = new ExtendedModifier();
                modifiers.prepend(extendedModifier);
                expect(modifiers.length).to.equal(2);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap).to.deep.equal([extendedModifier, modifier]);
                expect(modifiersMap[0]).to.equal(extendedModifier);
                expect(modifiersMap[1]).to.equal(modifier);
            });
            it('should prepend a modifier and instantiate it', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                modifiers.prepend(Modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.find(Modifier) instanceof Modifier).to.equal(true);
                modifiers.prepend(ExtendedModifier);
                expect(modifiers.length).to.equal(2);
                expect(modifiers.find(ExtendedModifier) instanceof ExtendedModifier).to.equal(true);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap[0] instanceof ExtendedModifier).to.be.true;
                expect(modifiersMap[1] instanceof Modifier).to.be.true;
                expect(modifiersMap[1] instanceof ExtendedModifier).to.be.false;
            });
            it('should prepend multiple modifiers in proper order', () => {
                const modifiers = new Modifiers(Modifier);
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const m4 = new Modifier();
                modifiers.prepend(m1, m2, m3, m4);
                const modifiersMap = modifiers.map(id);
                expect(modifiers.length).to.equal(5);
                expect(modifiersMap[0]).to.equal(m1);
                expect(modifiersMap[1]).to.equal(m2);
                expect(modifiersMap[2]).to.equal(m3);
                expect(modifiersMap[3]).to.equal(m4);
            });
        });
        describe('find()', () => {
            it('should find a unique modifier instance', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                modifiers.append(m1, m2);
                expect(modifiers.find(m1)).to.equal(m1);
                expect(modifiers.find(m2)).to.equal(m2);
            });
            it('should find a modifier instance by its constructor', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                modifiers.append(m1, m2);
                expect(modifiers.find(Modifier)).to.equal(m1);
                expect(modifiers.find(Modifier)).not.to.equal(m2);
                const extendedModifier = new ExtendedModifier();
                modifiers.append(extendedModifier);
                expect(modifiers.find(ExtendedModifier)).to.equal(extendedModifier);
            });
            it('should not find a modifier instance when searching by the constructor of an extension of it', () => {
                const modifiers = new Modifiers();
                modifiers.append(ExtendedModifier);
                // ExtendedModifier does inherit from Modifier but find() should
                // only return "direct" instances. To get extended instances,
                // use filter().
                expect(modifiers.find(Modifier)).to.be.undefined;
                expect(modifiers.find(ExtendedModifier)).not.to.be.undefined;
            });
            it('should find the first modifier instance satisfying a predicate', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const eM1 = new ExtendedModifier(1);
                const eM2 = new ExtendedModifier(2);
                const eM1bis = new ExtendedModifier(1);
                modifiers.append(m1, m2, eM1, eM2, eM1bis);
                expect(
                    modifiers.find(mod => mod instanceof ExtendedModifier && mod.value === 1),
                ).to.equal(eM1);
            });
            it('should not find a modifier if there are no modifiers', () => {
                const modifiers = new Modifiers();
                expect(modifiers.find(Modifier)).to.be.undefined;
            });
            it('should find a modifier of a modifier if it has a cascading effect', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const subModifiers = new Modifiers();
                m1.modifiers = subModifiers;
                class CascadingModifier extends Modifier {
                    static cascading = true;
                }
                const cascadingModifier = new CascadingModifier();
                subModifiers.append(cascadingModifier);
                modifiers.append(m1);
                // find by class
                expect(modifiers.find(CascadingModifier)).to.equal(cascadingModifier);
                // find by instance
                expect(modifiers.find(cascadingModifier)).to.equal(cascadingModifier);
                // find by predicate
                expect(modifiers.find(modifier => modifier === cascadingModifier)).to.equal(
                    cascadingModifier,
                );
            });
            it('should not find a modifier of a modifier if it does not have a cascading effect', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const subModifiers = new Modifiers();
                m1.modifiers = subModifiers;
                class NotCascadingModifier extends Modifier {}
                const notCascadingModifier = new NotCascadingModifier();
                subModifiers.append(notCascadingModifier);
                modifiers.append(m1);
                // find by class
                expect(modifiers.find(NotCascadingModifier)).to.be.undefined;
                // find by instance
                expect(modifiers.find(notCascadingModifier)).to.be.undefined;
                // find by predicate
                expect(modifiers.find(modifier => modifier === notCascadingModifier)).to.be
                    .undefined;
            });
        });
        describe('get()', () => {
            it('should get a unique modifier instance', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                modifiers.append(m1, m2);
                expect(modifiers.get(m1)).to.equal(m1);
                expect(modifiers.get(m2)).to.equal(m2);
            });
            it('should get a modifier instance by its constructor', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                modifiers.append(m1, m2);
                expect(modifiers.get(Modifier)).to.equal(m1);
                expect(modifiers.get(Modifier)).not.to.equal(m2);
                const extendedModifier = new ExtendedModifier();
                modifiers.append(extendedModifier);
                expect(modifiers.get(ExtendedModifier)).to.equal(extendedModifier);
            });
            it('should create and get a modifier instance', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                expect(modifiers.get(Modifier) instanceof Modifier).to.be.true;
                expect(modifiers.length).to.equal(1);
                expect(modifiers.get(ExtendedModifier) instanceof ExtendedModifier).to.be.true;
                expect(modifiers.length).to.equal(2);
            });
        });
        describe('filter()', () => {
            it('should get all the Modifier instances', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier();
                const eM2 = new ExtendedModifier();
                modifiers.append(m1, eM1, m2, eM2, m3);
                expect(modifiers.filter(Modifier)).to.deep.equal([m1, eM1, m2, eM2, m3]);
                expect(modifiers.filter(ExtendedModifier)).to.deep.equal([eM1, eM2]);
            });
            it('should get all the modifiers satisfying the predicate', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier(1);
                const eM2 = new ExtendedModifier(2);
                const eM1bis = new ExtendedModifier(1);
                modifiers.append(m1, eM1, m2, eM2, m3, eM1bis);
                expect(
                    modifiers.filter(mod => mod instanceof ExtendedModifier && mod.value === 1),
                ).to.deep.equal([eM1, eM1bis]);
            });
            it('should get an empty array if there are no modifiers', () => {
                const modifiers = new Modifiers();
                expect(modifiers.filter(Modifier)).to.deep.equal([]);
                expect(
                    modifiers.filter(mod => mod instanceof ExtendedModifier && mod.value === 1),
                ).to.deep.equal([]);
            });
        });
        describe('remove()', () => {
            it('should remove a specific Modifier instance', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                expect(modifiers.remove(m2)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m1, m3]);
            });
            it('should remove a modifier by its constructor', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier();
                const eM2 = new ExtendedModifier();
                modifiers.append(m1, eM1, m2, eM2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, eM1, m2, eM2, m3]);
                expect(modifiers.remove(ExtendedModifier)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m1, m2, eM2, m3]);
                expect(modifiers.remove(Modifier)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m2, eM2, m3]);
            });
            it('should do nothing if the modifier was not found', () => {
                const modifiers = new Modifiers(Modifier);
                expect(modifiers.remove(ExtendedModifier)).to.be.false;
            });
            it('should do nothing if there is no modifier', () => {
                const modifiers = new Modifiers();
                expect(modifiers.remove(Modifier)).to.be.false;
            });
        });
        describe('replace()', () => {
            it('should replace a specific Modifier instance with another', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                const m4 = new Modifier();
                expect(modifiers.replace(m2, m4)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m1, m4, m3]);
            });
            it('should replace a specific Modifier instance with a newly instantiated one', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                expect(modifiers.replace(m2, ExtendedModifier)).to.be.true;
                expect(modifiers.length).to.equal(3);
                expect(modifiers.find(m2)).to.be.undefined;
                expect(modifiers.map(id)[1] instanceof ExtendedModifier).to.be.true;
            });
            it('should replace the first found instance of Modifier with another', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                const m4 = new Modifier();
                expect(modifiers.replace(Modifier, m4)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m4, m2, m3]);
            });
            it('should replace the first found instance of Modifier with a newly instantiated one', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                expect(modifiers.replace(Modifier, ExtendedModifier)).to.be.true;
                expect(modifiers.find(m1)).to.be.undefined;
                expect(modifiers.map(id)[0] instanceof ExtendedModifier).to.be.true;
            });
            it('should replace the first found instance of an extension of Modifier with another', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier();
                const eM2 = new ExtendedModifier();
                modifiers.append(m1, eM1, m2, eM2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, eM1, m2, eM2, m3]);
                const eM3 = new ExtendedModifier();
                expect(modifiers.replace(ExtendedModifier, eM3)).to.be.true;
                expect(modifiers.map(id)).to.deep.equal([m1, eM3, m2, eM2, m3]);
            });
            it('should replace the first found instance of an extension of Modifier with a newly instantied one', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier();
                const eM2 = new ExtendedModifier();
                modifiers.append(m1, eM1, m2, eM2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, eM1, m2, eM2, m3]);
                expect(modifiers.replace(ExtendedModifier, Modifier)).to.be.true;
                expect(modifiers.find(eM1)).to.be.undefined;
                expect(modifiers.map(id)[1] instanceof ExtendedModifier).to.be.false;
                expect(modifiers.map(id)[1] instanceof Modifier).to.be.true;
            });
            it("should append a modifier when the one to replace couldn't be found", () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                const eM1 = new ExtendedModifier();
                expect(modifiers.replace(ExtendedModifier, eM1)).to.be.false;
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3, eM1]);
            });
            it("should append a new Modifier instance when the one to replace couldn't be found", () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                expect(modifiers.replace(ExtendedModifier, Modifier)).to.be.false;
                expect(modifiers.map(id)[3] instanceof ExtendedModifier).to.be.false;
                expect(modifiers.map(id)[3] instanceof Modifier).to.be.true;
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
                const allModifiers = modifiers1.map(id);
                for (const modifier of allModifiers) {
                    // Remove listeners that get applied on append, to compare
                    // modifiers.
                    modifier.off('update');
                }
                expect(allModifiers.length).to.eql(2);
                expect(allModifiers[0]).to.eql(m1b);
                expect(allModifiers[1]).to.eql(m2);
            });
            it('should replace one modifier (found by its constructor) and append the other', () => {
                class Modifier1 extends Modifier {}
                class Modifier2 extends Modifier {}
                const m1 = new Modifier1();
                const m2 = new Modifier2();
                const modifiers1 = new Modifiers(m1, m2);
                modifiers1.set(Modifier1);
                const allModifiers = modifiers1.map(id);
                for (const modifier of allModifiers) {
                    // Remove listeners that get applied on append, to compare
                    // modifiers.
                    modifier.off('update');
                }
                expect(allModifiers.length).to.eql(2);
                expect(allModifiers[0]).not.to.equal(m1);
                expect(allModifiers[0] instanceof Modifier1).to.be.true;
                expect(allModifiers[1]).to.eql(m2);
            });
        });
        describe('toggle()', () => {
            it('should remove a specific Modifier instance (using toggle)', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                modifiers.append(m1, m2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, m3]);
                modifiers.toggle(m2);
                expect(modifiers.map(id)).to.deep.equal([m1, m3]);
            });
            it('should remove a modifier by its constructor (using toggle)', () => {
                const modifiers = new Modifiers();
                const m1 = new Modifier();
                const m2 = new Modifier();
                const m3 = new Modifier();
                const eM1 = new ExtendedModifier();
                const eM2 = new ExtendedModifier();
                modifiers.append(m1, eM1, m2, eM2, m3);
                expect(modifiers.map(id)).to.deep.equal([m1, eM1, m2, eM2, m3]);
                modifiers.toggle(ExtendedModifier);
                expect(modifiers.map(id)).to.deep.equal([m1, m2, eM2, m3]);
                modifiers.toggle(Modifier);
                expect(modifiers.map(id)).to.deep.equal([m2, eM2, m3]);
            });
            it('should append a modifier instance (using toggle)', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                const modifier = new Modifier();
                modifiers.append(modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.map(id)).to.deep.equal([modifier]);
                const extendedModifier = new ExtendedModifier();
                modifiers.toggle(extendedModifier);
                expect(modifiers.length).to.equal(2);
                expect(modifiers.map(id)).to.deep.equal([modifier, extendedModifier]);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap[0]).to.equal(modifier);
                expect(modifiersMap[1]).to.equal(extendedModifier);
            });
            it('should append a modifier and instantiate it (using toggle)', () => {
                const modifiers = new Modifiers();
                expect(modifiers.length).to.equal(0);
                modifiers.append(Modifier);
                expect(modifiers.length).to.equal(1);
                expect(modifiers.find(Modifier) instanceof Modifier).to.equal(true);
                modifiers.toggle(ExtendedModifier);
                expect(modifiers.length).to.equal(2);
                expect(modifiers.find(ExtendedModifier) instanceof ExtendedModifier).to.equal(true);
                const modifiersMap = modifiers.map(id);
                expect(modifiersMap[0] instanceof Modifier).to.be.true;
                expect(modifiersMap[0] instanceof ExtendedModifier).to.be.false;
                expect(modifiersMap[1] instanceof ExtendedModifier).to.be.true;
            });
        });
        describe('areSameAs()', () => {
            it('should know that an instance of Modifiers is the same as itself', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const modifiers = new Modifiers(m1, m2);
                expect(modifiers.areSameAs(modifiers)).to.be.true;
            });
            it('should compare two instances of Modifiers favorably', () => {
                const m1 = new ExtendedModifier(1);
                const m2 = new ExtendedModifier(2);
                const modifiers1 = new Modifiers(m1, m2);
                const m1bis = new ExtendedModifier(1);
                const m2bis = new ExtendedModifier(2);
                const modifiers2 = new Modifiers(m1bis, m2bis);
                expect(modifiers1.areSameAs(modifiers2)).to.be.true;
            });
            it('should compare two instances of Modifiers favorably even if their order is different', () => {
                const m1 = new ExtendedModifier(1);
                const m2 = new ExtendedModifier(2);
                const modifiers1 = new Modifiers(m1, m2);
                const modifiers2 = new Modifiers(m2, m1);
                expect(modifiers1.areSameAs(modifiers2)).to.be.true;
            });
            it('should compare two instances of Modifiers favorably even if their order and instances are different', () => {
                const m1 = new ExtendedModifier(1);
                const m2 = new ExtendedModifier(2);
                const modifiers1 = new Modifiers(m1, m2);
                const m1bis = new ExtendedModifier(1);
                const m2bis = new ExtendedModifier(2);
                const modifiers2 = new Modifiers(m2bis, m1bis);
                expect(modifiers1.areSameAs(modifiers2)).to.be.true;
            });
            it('should compare two instances of Modifiers unfavorably if their values are different', () => {
                const m1 = new ExtendedModifier(1);
                const m2 = new ExtendedModifier(2);
                const modifiers1 = new Modifiers(m1, m2);
                const m3 = new ExtendedModifier(0);
                const modifiers2 = new Modifiers(m1, m3);
                expect(modifiers1.areSameAs(modifiers2)).to.be.false;
            });
            it('should compare two instances of Modifiers unfavorably if their lengths are different', () => {
                const m1 = new ExtendedModifier(1);
                const m2 = new ExtendedModifier(2);
                const modifiers1 = new Modifiers(m1, m2);
                const modifiers2 = new Modifiers(m1);
                expect(modifiers1.areSameAs(modifiers2)).to.be.false;
            });
        });
        describe('some()', () => {
            it('should find that one modifier matches the predicate', () => {
                const modifiers = new Modifiers(
                    Modifier,
                    ExtendedModifier,
                    new ExtendedModifier(5),
                    Modifier,
                );
                expect(modifiers.some(mod => mod instanceof ExtendedModifier && mod.value === 5)).to
                    .be.true;
            });
            it('should find that no modifier matches the predicate', () => {
                const modifiers = new Modifiers(Modifier, ExtendedModifier, Modifier);
                expect(modifiers.some(mod => mod instanceof ExtendedModifier && mod.value === 5)).to
                    .be.false;
            });
            it('should find that no modifier could match the predicate as there is no modifier', () => {
                const modifiers = new Modifiers();
                expect(modifiers.some(mod => mod instanceof ExtendedModifier && mod.value === 5)).to
                    .be.false;
            });
        });
        describe('every()', () => {
            it('should find that all modifiers match the predicate', () => {
                const modifiers = new Modifiers(new ExtendedModifier(5), new ExtendedModifier(5));
                expect(modifiers.every(mod => mod instanceof ExtendedModifier && mod.value === 5))
                    .to.be.true;
            });
            it('should find that not all modifiers match the predicate', () => {
                const modifiers = new Modifiers(
                    Modifier,
                    ExtendedModifier,
                    new ExtendedModifier(5),
                    Modifier,
                );
                expect(modifiers.every(mod => mod instanceof ExtendedModifier && mod.value === 5))
                    .to.be.false;
            });
            it('should find that all modifiers match the predicate as there is no modifier', () => {
                const modifiers = new Modifiers();
                expect(modifiers.every(mod => mod instanceof ExtendedModifier && mod.value === 5))
                    .to.be.true;
            });
        });
        describe('map()', () => {
            it('should return an array with the values of the modifiers', () => {
                const modifiers = new Modifiers(
                    new ExtendedModifier(0),
                    new ExtendedModifier(1),
                    new ExtendedModifier(2),
                );
                expect(
                    modifiers.map(mod => (mod instanceof ExtendedModifier && mod.value) || 0),
                ).to.deep.equal([0, 1, 2]);
            });
            it('should return an empty array if there is no modifier', () => {
                const modifiers = new Modifiers();
                expect(
                    modifiers.map(mod => (mod instanceof ExtendedModifier && mod.value) || 0),
                ).to.deep.equal([]);
            });
        });
    });
});
