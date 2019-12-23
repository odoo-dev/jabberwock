import { VNode } from './VNode';

export class VElement extends VNode {
    htmlTag: string;
    constructor(tagName: string) {
        super();
        this.htmlTag = tagName;
        this.name = tagName;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(node: Node): VElement[] {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(node.nodeName)) {
            return [new VElement(node.nodeName)];
        }
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
