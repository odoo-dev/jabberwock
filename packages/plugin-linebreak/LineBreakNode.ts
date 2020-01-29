import { VElement } from '../core/src/VNodes/VElement';
import { VNode, RelativePosition } from '../core/src/VNodes/VNode';

export class LineBreakNode extends VElement {
    static readonly atomic = true;
    constructor() {
        super('BR');
    }
    get name(): string {
        return '↲';
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
    /**
     * Transform the given DOM location into its VDocument counterpart.
     *
     * @override
     * @param domNode DOM node corresponding to this VNode
     * @param offset The offset of the location in the given domNode
     */
    locate(domNode: Node, offset: number): [VNode, RelativePosition] {
        const location = super.locate(domNode, offset);
        // When clicking on a trailing line break, we need to target after the
        // line break. The DOM represents these as 2 <br> so this is a special
        // case.
        if (!this.nextSibling() && !domNode.nextSibling) {
            location[1] = RelativePosition.AFTER;
        }
        return location;
    }
}
