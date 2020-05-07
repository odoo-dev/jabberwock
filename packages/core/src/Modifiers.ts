import { Modifier } from './Modifier';
import { Constructor } from '../../utils/src/utils';

export class Modifiers extends Array<Modifier> {
    constructor(...modifiers: Array<Modifier | Constructor<Modifier>>) {
        // Native Array constructor takes the length as argument.
        const length = modifiers[0];
        if (typeof length === 'number') {
            super(length);
        } else {
            super(0);
            const clonedModifiers = modifiers.map(mod => {
                return mod instanceof Modifier ? mod.clone() : mod;
            });
            this.append(...clonedModifiers);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Append one or more modifiers to the array. If one of the given modifiers
     * is a modifier class constructor, instantiate it.
     *
     * @param modifiers
     */
    append(...modifiers: Array<Modifier | Constructor<Modifier>>): void {
        for (const modifier of modifiers) {
            if (modifier instanceof Modifier) {
                this.push(modifier);
            } else {
                this.push(new modifier());
            }
        }
    }
    /**
     * Prepend one or more modifiers to the array. If one of the given modifiers
     * is a modifier class constructor, instantiate it.
     *
     * @param modifiers
     */
    prepend(...modifiers: Array<Modifier | Constructor<Modifier>>): void {
        for (const modifier of modifiers) {
            if (modifier instanceof Modifier) {
                this.unshift(modifier);
            } else {
                this.unshift(new modifier());
            }
        }
    }
    /**
     * Return the first modifier in the array that is an instance of the given
     * modifier class, if any. If the modifier passed is a modifier instance,
     * return it if it was present in the array.
     *
     * @param modifier
     */
    get<T extends Modifier>(modifier: T | Constructor<T>): T {
        if (modifier instanceof Modifier) {
            return this.find(mod => mod === modifier) as T;
        } else {
            return (this.find(mod => mod.constructor.name === modifier.name) ||
                this.find(mod => mod instanceof modifier)) as T;
        }
    }
    /**
     * Return all modifiers in the array that are an instance of the given
     * modifier class, if any.
     *
     * @param modifier
     */
    getAll<T extends Modifier>(modifier: Constructor<T>): T[] {
        const items = [];
        for (const instance of this) {
            if (instance instanceof modifier) {
                items.push(instance);
            }
        }
        return items;
    }
    /**
     * Remove the first modifier in the array that is an instance of the given
     * modifier class. If a modifier instance is given, remove that particuar
     * instance from the array. Return true if a modifier was removed, false
     * otherwise.
     *
     * @param modifier
     */
    remove(modifier: Modifier | Constructor<Modifier>): boolean {
        const modifierIndex = this.findIndex(modifierInstance => {
            if (modifier instanceof Modifier) {
                return modifierInstance === modifier;
            } else {
                return modifierInstance instanceof modifier;
            }
        });
        if (modifierIndex === -1) {
            return false;
        } else {
            this.splice(modifierIndex, 1);
            return true;
        }
    }
    /**
     * Replace the first modifier in the array that is an instance of the given
     * modifier class or that matches the particular instance passed with the
     * given modifier instance. If the new modifier passed is a class,
     * instantiate it. If no modifier was found, simply push the new modifier on
     * the array.
     *
     * Return true if a modifier was replaced, false if the modifier was simply
     * added.
     *
     * @param oldModifier
     * @param newModifier
     */
    replace(
        oldModifier: Modifier | Constructor<Modifier>,
        newModifier: Modifier | Constructor<Modifier>,
    ): boolean {
        const oldModifierIndex = this.findIndex(modifierInstance => {
            if (oldModifier instanceof Modifier) {
                return modifierInstance === oldModifier;
            } else {
                return modifierInstance instanceof oldModifier;
            }
        });
        if (oldModifierIndex === -1) {
            this.append(newModifier);
            return false;
        } else {
            const modifier = newModifier instanceof Modifier ? newModifier : new newModifier();
            this[oldModifierIndex] = modifier;
            return true;
        }
    }
    /**
     * Remove the first modifier in the array that is an instance of the given
     * modifier class or that matches the particular instance passed.
     * If no modifier was found, add the given modifier instead.
     * If the given new modifier is a class, instantiate it.
     *
     * @param modifier
     */
    toggle(modifier: Modifier | Constructor<Modifier>): void {
        this.remove(modifier) || this.append(modifier);
    }
    /**
     * Return a new instance of the Modifiers class containing the same
     * modifiers.
     */
    clone(): Modifiers {
        return new Modifiers(...this);
    }
    /**
     * Return true if the modifiers in this array are the same as the modifiers
     * in the given array (as defined by the `isSameAs` methods of the
     * modifiers).
     *
     * @param otherModifiers
     */
    areSameAs(otherModifiers: Modifiers): boolean {
        const modifiersMap = new Map(this.map(a => [a, otherModifiers.find(b => a.isSameAs(b))]));
        const aModifiers = Array.from(modifiersMap.keys());
        const bModifiers = Array.from(modifiersMap.values());

        const allAinB = aModifiers.every(a => a.isSameAs(modifiersMap.get(a)));
        const allBinA = otherModifiers.every(
            b => bModifiers.includes(b) || b.isSameAs(this.get(b)),
        );
        return allAinB && allBinA;
    }
}
