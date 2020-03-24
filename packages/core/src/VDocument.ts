import { VNode } from './VNodes/VNode';
import { FragmentNode } from './VNodes/FragmentNode';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';

export class VDocument {
    root: FragmentNode;

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
        if (range.startContainer.breakable) {
            range.startContainer.splitAt(range.start);
        } else {
            // TODO
            range.start.before(new LineBreakNode());
        }
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
