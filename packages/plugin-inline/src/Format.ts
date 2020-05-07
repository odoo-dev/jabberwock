import { Modifier } from '../../core/src/Modifier';
import { Modifiers } from '../../core/src/Modifiers';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class Format extends Modifier {
    htmlTag: string; // TODO: remove this reference to DOM.
    modifiers = new Modifiers();
    constructor(htmlTag?: string) {
        super();
        this.htmlTag = htmlTag;
    }
    get name(): string {
        return this.htmlTag.toLowerCase();
    }
    toString(): string {
        if (Object.keys(this.modifiers).length) {
            return this.name + '[' + Object.keys(this.modifiers).join(', ') + ']';
        } else {
            return this.name;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    render(): Node {
        const node = document.createElement(this.htmlTag);
        const attributes = this.modifiers.get(Attributes);
        if (attributes) {
            for (const name of attributes.keys()) {
                node.setAttribute(name, this.modifiers.get(Attributes).get(name));
            }
        }
        return node;
    }
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
