import { Modifier } from './Modifier';
import { Constructor, isConstructor } from '../../utils/src/utils';

export class Modifiers {
    private _contents: Modifier[];
    constructor(...modifiers: Array<Modifier | Constructor<Modifier>>) {
        const clonedModifiers = modifiers.map(mod => {
            return mod instanceof Modifier ? mod.clone() : mod;
        });
        this.append(...clonedModifiers);
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * Return the length of the array.
     */
    get length(): number {
        return this._contents?.length || 0;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new instance of the Modifiers class containing the same
     * modifiers.
     */
    clone(): Modifiers {
        if (this._contents) {
            return new Modifiers(...this._contents.map(mod => mod.clone()));
        } else {
            return new Modifiers();
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
        if (modifiers.length && !this._contents) {
            this._contents = [];
        }
        for (const modifier of modifiers) {
            if (modifier instanceof Modifier) {
                this._contents.push(modifier);
            } else {
                this._contents.push(new modifier());
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
        if (modifiers.length && !this._contents) {
            this._contents = [];
        }
        for (const modifier of [...modifiers].reverse()) {
            if (modifier instanceof Modifier) {
                this._contents.unshift(modifier);
            } else {
                this._contents.unshift(new modifier());
            }
        }
    }
    /**
     * Return the first modifier in the array that is an instance of the given
     * Modifier class, if any.
     * If the modifier passed is a Modifier instance, return it if it was
     * present in the array.
     * This also functions as a proxy to the native `find` method of `Array`,
     * for `this._contents`.
     *
     * @see Array.find
     * @param modifier
     */
    find<T extends Modifier>(callback: (modifier: T) => boolean): T;
    find<T extends Modifier>(modifier: T | Constructor<T>): T;
    find<T extends Modifier>(modifier: ((modifier: T) => boolean) | T | Constructor<T>): T {
        if (!this._contents) {
            return;
        } else if (modifier instanceof Modifier) {
            // `modifier` is an instance of `Modifier` -> find it in the array.
            return this._contents.find(instance => instance === modifier) as T;
        } else if (isConstructor<typeof Modifier>(modifier, Modifier)) {
            // `modifier` is a `Modifier` class -> find its first instance in
            // the array.
            return this._contents.find(mod => mod.constructor.name === modifier.name) as T;
        } else if (modifier instanceof Function) {
            // `modifier` is a callback -> call `find` natively on the array.
            return this._contents.find(modifier) as T;
        }
    }
    /**
     * Return the first modifier in the array that is an instance of the given
     * modifier class or create one, append it and return it.
     * If the modifier passed is a modifier instance, return it if it was
     * present in the array.
     *
     * @param modifier
     */
    get<T extends Modifier>(modifier: T | Constructor<T>): T {
        let found = this.find(modifier);
        if (!found && isConstructor<typeof Modifier>(modifier, Modifier)) {
            found = new modifier();
            this.append(found);
        }
        return found;
    }
    /**
     * Return all modifiers in the array that are an instance of the given
     * modifier class, if any.
     * This also functions as a proxy to the native `filter` method of `Array`,
     * for `this._contents`.
     *
     * @see Array.filter
     * @param modifier
     */
    filter<T extends Modifier>(
        callbackfn: (value: Modifier, index: number, array: Modifier[]) => boolean,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any,
    ): T[];
    filter<T extends Modifier>(modifier: Constructor<T>): T[];
    filter<T extends Modifier>(
        modifier: ((value: Modifier, index: number, array: Modifier[]) => boolean) | Constructor<T>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any,
    ): T[] {
        if (!this._contents) {
            return [];
        } else if (isConstructor<typeof Modifier>(modifier, Modifier)) {
            // `modifier` is a `Modifier` class -> return all instances of it in
            // the array.
            return this._contents.filter(m => m instanceof modifier) as T[];
        } else {
            // `modifier` is a callback -> call `filter` natively on the array.
            return this._contents.filter(modifier, thisArg) as T[];
        }
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
        if (!this._contents) {
            return false;
        }
        const modifierIndex = this._contents.findIndex(modifierInstance => {
            if (modifier instanceof Modifier) {
                return modifierInstance === modifier;
            } else {
                return modifierInstance instanceof modifier;
            }
        });
        if (modifierIndex === -1) {
            return false;
        } else {
            this._contents.splice(modifierIndex, 1);
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
        const oldModifierIndex = this._contents?.findIndex(modifierInstance => {
            if (oldModifier instanceof Modifier) {
                return modifierInstance === oldModifier;
            } else {
                return modifierInstance instanceof oldModifier;
            }
        });
        if (!this._contents || oldModifierIndex === -1) {
            this.append(newModifier);
            return false;
        } else {
            const modifier = newModifier instanceof Modifier ? newModifier : new newModifier();
            this._contents[oldModifierIndex] = modifier;
            return true;
        }
    }
    /**
     * Set the given modifiers on this Modifiers instance. Replace the modifiers
     * with same constructor if they exist, otherwise append the modifiers.
     *
     * @param modfiers
     */
    set(...modifiers: Array<Modifier | Constructor<Modifier>>): void {
        for (const modifier of modifiers) {
            if (modifier instanceof Modifier) {
                this.replace(modifier.constructor, modifier);
            } else {
                this.replace(modifier, modifier);
            }
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
     * Return true if the modifiers in this array are the same as the modifiers
     * in the given array (as defined by the `isSameAs` methods of the
     * modifiers).
     *
     * @param otherModifiers
     */
    areSameAs(otherModifiers: Modifiers): boolean {
        const modifiersMap = new Map(
            this._contents?.map(a => [a, otherModifiers.find(b => a.isSameAs(b))]) || [],
        );
        const aModifiers = Array.from(modifiersMap.keys());
        const bModifiers = Array.from(modifiersMap.values());

        const allAinB = aModifiers.every(a => a.isSameAs(modifiersMap.get(a)));
        const allBinA = otherModifiers.every(
            b => bModifiers.includes(b) || b.isSameAs(this.find(b)),
        );
        return allAinB && allBinA;
    }
    /**
     * Remove all modifiers.
     */
    empty(): void {
        if (this._contents) {
            this._contents.length = 0;
        }
    }
    /**
     * Proxy for the native `some` method of `Array`, called on `this._contents`.
     *
     * @see Array.some
     * @param callbackfn
     */
    some(callbackfn: (value: Modifier, index: number, array: Modifier[]) => unknown): boolean {
        return this._contents?.some(callbackfn) || false;
    }
    /**
     * Proxy for the native `every` method of `Array`, called on `this._contents`.
     *
     * @see Array.every
     * @param callbackfn
     */
    every(callbackfn: (value: Modifier, index: number, array: Modifier[]) => unknown): boolean {
        return this._contents ? this._contents.every(callbackfn) : true;
    }
    /**
     * Proxy for the native `map` method of `Array`, called on `this._contents`.
     *
     * @see Array.map
     * @param callbackfn
     */
    map<T>(callbackfn: (value: Modifier, index: number, array: Modifier[]) => T): T[] {
        return this._contents?.map(callbackfn) || [];
    }
}
