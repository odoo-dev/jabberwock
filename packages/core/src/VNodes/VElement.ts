import { VNode } from './VNode';

export class VElement extends VNode {
    htmlTag: string;
    constructor(tagName: string) {
        super();
        this.htmlTag = tagName;
    }

    get name(): string {
        if (this.constructor.name === 'VElement') {
            return 'VElement: ' + this.htmlTag;
        }
        return this.constructor.name;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VElement {
        return new VElement(this.htmlTag);
    }
}
