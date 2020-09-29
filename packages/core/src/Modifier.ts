import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';
import { EventMixin } from '../../utils/src/EventMixin';

export enum ModifierLevel {
    LOW,
    MEDIUM,
    HIGH,
}
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
export class Modifier extends EventMixin {
    preserveAfterNode = true; // True to preserve modifier after the node that holds it.
    preserveAfterParagraphBreak = true; // True to preserve modifier after a paragraph break.
    preserveAfterLineBreak = true; // True to preserve modifier after a line break.
    level = ModifierLevel.MEDIUM;

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
