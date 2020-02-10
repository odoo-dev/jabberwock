import { deepEqualObjects } from '../utils/src/utils';

export class Format {
    htmlTag: string; // TODO: remove this reference to DOM.
    attributes: Record<string, string> = {};
    constructor(htmlTag?: string) {
        this.htmlTag = htmlTag;
    }
    get name(): string {
        return this.htmlTag.toLowerCase();
    }
    toString(): string {
        if (Object.keys(this.attributes).length) {
            return this.name + '[' + Object.keys(this.attributes).join(', ') + ']';
        } else {
            return this.name;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    render(): Node {
        const node = document.createElement(this.htmlTag);
        for (const name of Object.keys(this.attributes)) {
            node.setAttribute(name, this.attributes[name]);
        }
        return node;
    }
    clone(): Format {
        const clone = new (this.constructor as typeof Format)();
        clone.htmlTag = this.htmlTag;
        clone.attributes = { ...this.attributes };
        return clone;
    }
    isSameAs(otherFormat: Format): boolean {
        return (
            this.constructor.name === otherFormat.constructor.name &&
            deepEqualObjects(this.attributes, otherFormat.attributes)
        );
    }
}
