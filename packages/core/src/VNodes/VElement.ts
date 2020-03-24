import { ContainerNode } from './ContainerNode';

export class VElement extends ContainerNode {
    htmlTag: string;
    constructor(tagName: string) {
        super();
        this.htmlTag = tagName;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(): this {
        const clone = new this.constructor<typeof VElement>(this.htmlTag);
        clone.attributes = { ...this.attributes };
        return clone;
    }
}
