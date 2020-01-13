import { VNode } from '../../../core/src/VNodes/VNode';
import { VElement } from '../../../core/src/VNodes/VElement';
import { RelativePosition } from '../../../utils/src/range';

export class LineBreakNode extends VElement {
    static readonly atomic = true;
    repr = '↲';
    constructor() {
        super('BR');
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    shallowDuplicate(): LineBreakNode {
        return new LineBreakNode();
    }
    /**
     * Locate where to set the range, when it targets this VNode, at a certain
     * offset. This allows us to handle special cases.
     *
     * @param domNode
     * @param offset
     */
    locateRange(domNode: Node, offset: number): [VNode, RelativePosition] {
        const rangeLocation = super.locateRange(domNode, offset);
        // When clicking on a trailing line break, we need to target after the
        // line break. The DOM represents these as 2 <br> so this is a special
        // case.
        if (!this.nextSibling() && !domNode.nextSibling) {
            rangeLocation[1] = RelativePosition.AFTER;
        }
        return rangeLocation;
    }
}
