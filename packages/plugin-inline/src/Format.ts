import { deepEqualObjects, Constructor } from '../../utils/src/utils';
import { InlineNode } from './InlineNode';

interface FormatConstructor {
    new <T extends Constructor<Format>>(...args: ConstructorParameters<T>): this;
}
export interface Format {
    constructor: FormatConstructor & this;
}
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
    applyTo(node: InlineNode): void {
        node.formats.unshift(this);
    }
    clone(): this {
        const clone = new this.constructor();
        clone.htmlTag = this.htmlTag;
        clone.attributes = { ...this.attributes };
        return clone;
    }
    isSameAs(otherFormat: Format): boolean {
        return (
            otherFormat instanceof this.constructor &&
            deepEqualObjects(this.attributes, otherFormat.attributes)
        );
    }
}
