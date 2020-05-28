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

    render(): Element {
        const domNode = document.createElement(this.htmlTag);
        const attributes = this.modifiers.find(Attributes);
        if (attributes) {
            for (const name of attributes.keys()) {
                domNode.setAttribute(name, attributes.get(name));
            }
            if (attributes.style.length) {
                for (const name of attributes.style.keys().sort()) {
                    domNode.style.setProperty(name, attributes.style.get(name));
                }
            }
            if (attributes.classList.length) {
                for (const className of attributes.classList.items()) {
                    domNode.classList.add(className);
                }
            }
        }
        return domNode;
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
    // /**
    //  * Merge the current format with the previous format.
    //  */
    // merge(format: Format) {}
}
