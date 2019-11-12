import { VNode, VNodeType } from './VNode';
import { VRange } from './VRange';

export let withRange = false;

export class VDocument {
    root: VNode;
    range = new VRange();
    constructor(root: VNode) {
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
    insert(node: VNode): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        this.range.start.before(node);
    }
    /**
     * Insert text at range.
     *
     * @param text
     */
    insertText(text: string): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('').reverse();
        characters.forEach(char => {
            // TODO: determine format from current position
            const vNode = new VNode(VNodeType.CHAR, '#text', char);
            this.range.start.before(vNode);
        });
    }
    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(): void {
        VDocument.withRange(() => {
            const nodes = this.range.selectedNodes;
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

    //--------------------------------------------------------------------------
    // Context
    //--------------------------------------------------------------------------

    /**
     * Call a callback on this VNode without ignoring the range nodes.
     *
     * @param callback
     */
    static withRange<T>(callback: () => T): T {
        // Record the previous value to allow for nested calls to `withRange`.
        const previousValue = withRange;
        withRange = true;
        const result = callback();
        withRange = previousValue;
        return result;
    }
}
