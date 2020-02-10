import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { FragmentNode } from './VNodes/FragmentNode';
import { VSelection } from './VSelection';

export class VDocument {
    root: VNode;
    selection = new VSelection();

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(range = this.selection.range): void {
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
    insert(node: VNode, range = this.selection.range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        range.start.before(node);
    }
}
