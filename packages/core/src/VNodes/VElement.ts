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
     * @override
     */
    toString(): string {
        let string = '<' + this.constructor.name + ':' + this.name;
        if (this.hasChildren()) {
            string += '>';
            this.children.forEach(child => {
                string += child.toString();
            });
            string += '</' + this.constructor.name + ':' + this.name + '>';
        } else {
            string += '/>';
        }
        return string;
    }
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VElement {
        return new VElement(this.htmlTag);
    }
}
