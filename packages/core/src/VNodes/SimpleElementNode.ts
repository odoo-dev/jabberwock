import { VNode, VNodeType } from './VNode';

export class SimpleElementNode extends VNode {
    htmlTag = '';
    constructor(type: VNodeType) {
        super(type);
        this.htmlTag =
            {
                heading1: 'H1',
                heading2: 'H2',
                heading3: 'H3',
                heading4: 'H4',
                heading5: 'H5',
                heading6: 'H6',
                paragraph: 'P',
            }[this.type] || 'UNKNOWN-ELEMENT';
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(node: Node): SimpleElementNode {
        switch (node.nodeName) {
            case 'H1':
                return new SimpleElementNode(VNodeType.HEADING1);
            case 'H2':
                return new SimpleElementNode(VNodeType.HEADING2);
            case 'H3':
                return new SimpleElementNode(VNodeType.HEADING3);
            case 'H4':
                return new SimpleElementNode(VNodeType.HEADING4);
            case 'H5':
                return new SimpleElementNode(VNodeType.HEADING5);
            case 'H6':
                return new SimpleElementNode(VNodeType.HEADING6);
            case 'P':
                return new SimpleElementNode(VNodeType.PARAGRAPH);
            default:
                return null;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    shallowDuplicate(): SimpleElementNode {
        return new SimpleElementNode(this.type as VNodeType);
    }
}
