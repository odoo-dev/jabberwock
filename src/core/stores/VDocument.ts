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
        let reference = nodes[0];
        const container = reference.parent;
        nodes.forEach(vNode => {
            // If the node has children, try to merge it with the container of
            // the range, that is insert them right after the first range node.
            // Children of the merged node that are selected will be deleted in
            // the following iterations since they appear in `selectedNodes`.
            // The children array must be cloned to modify it while iterating.
            // TODO: test whether the node can be merged with the container.
            if (vNode.children.length) {
                vNode.children.slice().forEach(child => {
                    container.insertAfter(child, reference);
                    reference = child;
                });
            }
            // Then remove.
            vNode.remove();
        });
        this.range.collapse(); // Reset the direction of the range.
    }
}
