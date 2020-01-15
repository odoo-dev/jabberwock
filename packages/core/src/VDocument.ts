import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { FormatType } from '../../plugin-char/CharNode';
import { withMarkers } from '../../utils/src/range';
import { FragmentNode } from './VNodes/FragmentNode';

export class VDocument {
    root: VNode;
    range = new VRange();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: FormatType = null;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        this.range.start.parent.splitAt(this.range.start);
    }
    /**
     * Insert something at range.
     *
     * @param node
     */
    insert(node: VNode): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        this.range.start.before(node);
    }
    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(): void {
        withMarkers(() => {
            const nodes = this.range.selectedNodes();
            if (!nodes.length) return;
            this.range.collapse(this.range.start); // Reset the direction of the range.
            let reference = this.range.end;
            nodes.forEach(vNode => {
                // If the node has children, merge it with the container of the
                // range. Children of the merged node that should be truncated
                // as well will be deleted in the following iterations since
                // they appear in `nodes`. The children array must be cloned in
                // order to modify it while iterating.
                // TODO: test whether the node can be merged with the container.
                if (vNode.hasChildren()) {
                    vNode.children.slice().forEach(child => {
                        reference.after(child);
                        reference = child;
                    });
                }
            });
            // Then remove.
            nodes.forEach(vNode => vNode.remove());
        });
    }
}
