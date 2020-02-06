import { VNode } from './VNode';

export class VElement extends VNode {
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
        return new this.constructor<typeof VElement>(this.htmlTag);
    }
}
