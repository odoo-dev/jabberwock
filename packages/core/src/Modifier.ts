import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';
import { VersionableObject } from './Memory/VersionableObject';

interface ModifierConstructor {
    new <T extends Constructor<Modifier>>(...args: ConstructorParameters<T>): this;
}
export interface Modifier {
    constructor: ModifierConstructor & this;
}
export class Modifier extends VersionableObject {
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
