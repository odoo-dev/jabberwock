import { VNode } from './VNodes/VNode';
import { FragmentNode } from './VNodes/FragmentNode';

export class VDocument {
    root: FragmentNode;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert something at range.
     *
     * @param node
     */
    insert(node: VNode, range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        range.start.before(node);
    }
}
