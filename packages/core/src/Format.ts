import { Modifier } from './Modifier';
import { Modifiers } from './Modifiers';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class Format extends Modifier {
    htmlTag: string; // TODO: remove this reference to DOM.
    _modifiers: Modifiers;
    constructor(htmlTag?: string) {
        super();
        this.modifiers = new Modifiers();
        if (htmlTag) {
            this.htmlTag = htmlTag;
        }
    }
    get name(): string {
        return this.htmlTag.toLowerCase();
    }
    get modifiers(): Modifiers {
        return this._modifiers;
    }
    set modifiers(modifiers: Modifiers) {
        if (this._modifiers) {
            this._modifiers.off('update');
        }
        this._modifiers = modifiers;
        this._modifiers.on('update', () => this.trigger('modifierUpdate'));
    }
    toString(): string {
        const nonEmptyAttributes = this.modifiers.filter(
            modifier => !(modifier instanceof Attributes) || !!modifier.length,
        );
        if (nonEmptyAttributes.length) {
            const modifiersRepr = [];
            for (const modifier of nonEmptyAttributes) {
                modifiersRepr.push(modifier.toString());
            }
            return `${this.name}[${modifiersRepr.join(', ')}]`;
        } else {
            return this.name;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    clone(): this {
        const clone = new this.constructor();
        clone.htmlTag = this.htmlTag;
        clone.modifiers = this.modifiers.clone();
        return clone;
    }
    isSameAs(otherFormat: Format): boolean {
        const aModifiers = this.modifiers;
        const bModifiers = otherFormat?.modifiers;
        return otherFormat instanceof this.constructor && aModifiers.areSameAs(bModifiers);
    }
}
