import { VNode, VNodeType } from '../VNode';
import { RelativePosition } from '../../../utils/src/range';

export class LineBreakNode extends VNode {
    constructor() {
        super(VNodeType.LINE_BREAK, 'BR');
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    render<T>(to = 'html'): T {
        const t = this.renderingEngines[to].render(this) as T;
        if (to === 'html' && !this.nextSibling() && t instanceof DocumentFragment) {
            // If a LINE_BREAK has no next sibling, it must be rendered as two
            // BRs in order for it to be visible.
            t.appendChild(document.createElement('br'));
        }
        return t;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the VNode is atomic (ie. it may not have children).
     *
     * @override
     */
    get atomic(): boolean {
        return true;
    }
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    shallowDuplicate(): VNode {
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
