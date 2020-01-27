import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { FormatName, Format } from './Format';
import { withMarkers } from '../../utils/src/markers';
import { FragmentNode } from './VNodes/FragmentNode';
import { VSelection } from './VSelection';

export class VDocument {
    root: VNode;
    selection = new VSelection();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: Record<FormatName, Format> = null;

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
            this.deleteSelection(range);
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
            this.deleteSelection(range);
        }
        range.start.before(node);
    }
    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(range: VRange): void {
        withMarkers(() => {
            const selectedNodes = range.selectedNodes();
            if (!selectedNodes.length) return;
            // If the node has children, merge it with the container of the
            // range. Children of the merged node that should be truncated
            // as well will be deleted in the following iterations since
            // they appear in `nodes`. The children array must be cloned in
            // order to modify it while iterating.
            const newContainer = range.start.parent;
            selectedNodes.forEach(vNode => {
                if (vNode.hasChildren()) {
                    vNode.mergeWith(newContainer);
                } else {
                    vNode.remove();
                }
            });
        });
    }
}
