import { VNode } from './VNodes/VNode';
import { FragmentNode } from './VNodes/FragmentNode';

export class VDocument {
    root: VNode;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        range.startContainer.splitAt(range.start);
    }
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
