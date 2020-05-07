import { Constructor } from '../../utils/src/utils';
import { VNode } from './VNodes/VNode';

interface ModifierConstructor {
    new <T extends Constructor<Modifier>>(...args: ConstructorParameters<T>): this;
}
export interface Modifier {
    constructor: ModifierConstructor & this;
}
export class Modifier {
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
        node.modifiers.unshift(this);
    }
    isSameAs(otherModifier: Modifier): boolean {
        return otherModifier instanceof this.constructor;
    }
    clone(): this {
        return new this.constructor();
    }
}
