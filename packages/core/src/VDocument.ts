import { VNode } from './VNodes/VNode';
import { FormatType } from '../../plugin-char/CharNode';
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
