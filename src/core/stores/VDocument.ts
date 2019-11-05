import { VNode, VNodeType } from './VNode';
import { VRange } from './VRange';

export class VDocument {
    root: VNode;
    range = new VRange();
    constructor(root: VNode) {
        this.root = root;
        this.range.setAt(this.root);
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
            this.truncate(this.range.selectedNodes);
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
            this.truncate(this.range.selectedNodes);
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
     * Truncate the tree by removing the given nodes and merging their orphaned
     * children into the parent of the first removed node.
     *
     * @param nodes
     */
    truncate(nodes: VNode[]): void {
        if (!nodes.length) return;
        // Determine where and how to reattach the orphaned child nodes.
        const firstNode = nodes[0];
        let reference = firstNode.previousSibling();
        let methodName = 'after';
        if (!reference) {
            reference = firstNode.nextSibling();
            methodName = 'before';
        }
        if (!reference) {
            reference = firstNode.parent;
            methodName = 'append';
        }
        nodes.forEach(vNode => {
            // If the node has children, merge it with the container of the
            // range. Children of the merged node that should be truncated as
            // well will be deleted in the following iterations since they
            // appear in `nodes`. The children array must be cloned in order to
            // modify it while iterating.
            // TODO: test whether the node can be merged with the container.
            if (vNode.children.length) {
                vNode.children.slice().forEach(child => {
                    reference[methodName](child);
                    reference = child;
                });
            }
            // Then remove.
            vNode.remove();
        });
        this.range.collapse(); // Reset the direction of the range.
    }
}
