import { VNode, VNodeType } from '../VNode';

const tags = {
    [VNodeType.HEADING1]: 'H1',
    [VNodeType.HEADING2]: 'H2',
    [VNodeType.HEADING3]: 'H3',
    [VNodeType.HEADING4]: 'H4',
    [VNodeType.HEADING5]: 'H5',
    [VNodeType.HEADING6]: 'H6',
    [VNodeType.PARAGRAPH]: 'P',
};
const types = Object.keys(tags).reduce((accumulator, type) => {
    return {
        ...accumulator,
        [tags[type]]: type,
    };
}, {});

export class SimpleElementNode extends VNode {
    htmlTag = '';
    constructor(type: VNodeType) {
        super(type);
        this.htmlTag = tags[this.type] || 'UNKNOWN-ELEMENT';
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(node: Node): VNode | VNode[] | null {
        const type = types[node.nodeName];
        return type ? new SimpleElementNode(type).addClass((node as Element).className) : null;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): VNode {
        return new SimpleElementNode(this.type as VNodeType);
    }
}
