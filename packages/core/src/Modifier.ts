import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';

interface ModifierConstructor {
    new <T extends Constructor<Modifier>>(...args: ConstructorParameters<T>): this;
}
export interface Modifier {
    constructor: ModifierConstructor & this;
}
export class Modifier {
    /**
     * The name of the this Modifier.
     */
    get name(): string {
        return '';
    }
    /**
     * Return the string representation of this Modifier.
     */
    toString(): string {
        return this.name;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    applyTo(node: VNode): void {
        node.modifiers.prepend(this);
    }
    /**
     * Compare two modifiers.
     *
     * Meant to be overridden if necessary.
     */
    isSameAs(otherModifier: Modifier): boolean {
        return this === otherModifier;
    }
    /**
     * Clone this modifier.
     */
    clone(): this {
        return new this.constructor();
    }
}
