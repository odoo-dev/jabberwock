import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';
import { VersionableObject } from './Memory/VersionableObject';

export type ModifierTypeguard<T extends Modifier> = (modifier: Modifier) => modifier is T;
export type ModifierPredicate<T = Modifier | boolean> = T extends Modifier
    ? Constructor<T> | ModifierTypeguard<T>
    : (modifier: Modifier) => boolean;

interface ModifierConstructor {
    new <T extends Constructor<Modifier>>(...args: ConstructorParameters<T>): this;
}
export interface Modifier {
    constructor: ModifierConstructor & this;
}
export class Modifier extends VersionableObject {
    preserve = true;
    get name(): string {
        return '';
    }
    toString(): string {
        return this.name;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    applyTo(node: VNode): void {
        node.modifiers.prepend(this);
    }
    isSameAs(otherModifier: Modifier): boolean {
        return this === otherModifier;
    }
    clone(): this {
        return new this.constructor();
    }
}
