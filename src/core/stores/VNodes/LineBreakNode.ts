import { VNode, VNodeType } from '../VNode';

export class LineBreakNode extends VNode {
    properties = {
        atomic: true,
    };

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
}
