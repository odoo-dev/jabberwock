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
export interface ModifierPreserve {
    after: boolean; // True to preserve modifier after the node that holds it.
    paragraphBreak: boolean; // True to preserve modifier after a paragraph break.
    lineBreak: boolean; // True to preserve modifier after a line break.
}
export class Modifier extends VersionableObject {
    preserve: ModifierPreserve = new VersionableObject({
        after: true,
        paragraphBreak: true,
        lineBreak: true,
    }) as ModifierPreserve;
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
    isSameAs(otherModifier: Modifier | void): boolean {
        return this === otherModifier;
    }
    clone(): this {
        return new this.constructor();
    }
}
