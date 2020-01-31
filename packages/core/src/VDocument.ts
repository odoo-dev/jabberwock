import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { FormatType } from '../../plugin-char/CharNode';
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
            for (const node of range.selectedNodes()) {
                node.remove();
            }

            if (range.startContainer !== range.endContainer) {
                const commonAncestor = range.start.commonAncestor(range.end);
                let ancestor = range.endContainer.parent;
                while (ancestor !== commonAncestor) {
                    if (ancestor.children.length > 1) {
                        ancestor.splitAt(range.endContainer);
                    }
                    range.endContainer.mergeWith(ancestor);
                    ancestor = range.endContainer.parent;
                }
                range.endContainer.mergeWith(range.startContainer);
            }
        });
    }
}
