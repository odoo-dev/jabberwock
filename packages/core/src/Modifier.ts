import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';

export type ModifierTypeguard<T extends Modifier> = (
    modifier: Modifier,
    batch: VNode[],
) => modifier is T;
export type ModifierPredicate<T = Modifier | boolean> = T extends Modifier
    ? Constructor<T> | ModifierTypeguard<T>
    : (modifier: Modifier, batch: VNode[]) => boolean;

interface ModifierConstructor {
    new <T extends Constructor<Modifier>>(...args: ConstructorParameters<T>): this;
}
export interface Modifier {
    constructor: ModifierConstructor & this;
}
export class Modifier {
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
