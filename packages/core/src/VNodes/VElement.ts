import { VNode } from './VNode';

export class VElement extends VNode {
    htmlTag: string;
    constructor(tagName: string) {
        super();
        this.htmlTag = tagName;
        this.name = tagName;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VElement {
        return new VElement(this.htmlTag);
    }
}
