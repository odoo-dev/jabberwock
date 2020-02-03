import { utils } from '../utils/src/utils';

export class Format {
    htmlTag: string;
    attributes = new Map<string, string>();
    constructor(htmlTag?: string) {
        this.htmlTag = htmlTag;
    }
    get name(): string {
        return this.htmlTag.toLowerCase();
    }
    toString(): string {
        if (this.attributes.size) {
            return this.name + '[' + Array.from(this.attributes.keys()).join(', ') + ']';
        } else {
            return this.name;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    render(): Node {
        const node = document.createElement(this.htmlTag);
        if (this.attributes) {
            this.attributes.forEach((value: string, name: string) => {
                node.setAttribute(name, value);
            });
        }
        return node;
    }
    shallowDuplicate(): Format {
        const duplicate = new (this.constructor as typeof Format)();
        duplicate.htmlTag = this.htmlTag;
        duplicate.attributes = new Map(this.attributes);
        return duplicate;
    }
    isSameAs(otherFormat: Format): boolean {
        return (
            this.constructor.name === otherFormat.constructor.name &&
            utils.deepEqualMaps(this.attributes, otherFormat.attributes)
        );
    }
}
