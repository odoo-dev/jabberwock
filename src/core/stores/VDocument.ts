import { VNode, VNodeType } from './VNode';
import { VRange, RelativePosition } from './VRange';

export class VDocument {
    root: VNode;
    range = new VRange();
    constructor(root: VNode) {
        this.root = root;
        this.range.setStart(RelativePosition.BEFORE, this.root.firstLeaf).collapse();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Handle the general expected behavior (a block split) of the enter key.
     */
    enter(): void {
        // Remove the contents of the selection if needed.
        if (!this.range.collapsed) {
            this.removeSelection();
        }
        // Do the splitting.
        const nextSiblings: VNode[] = [this.range.first];
        this.range.first.nextSiblings((sibling): boolean => {
            nextSiblings.push(sibling);
            return false;
        });
        const oldParent = this.range.first.parent;
        const duplicatedParent = new VNode(oldParent.type, oldParent.originalTag);
        oldParent.after(duplicatedParent);
        nextSiblings.forEach(sibling => duplicatedParent.append(sibling));
    }
    /**
     * Insert something at range.
     *
     * @param value
     */
    insert(value: string | VNode): void {
        // Remove the contents of the selection if needed.
        if (!this.range.collapsed) {
            this.removeSelection();
        }
        // Do the inserting.
        if (typeof value === 'string') {
            this._insertText(value);
        } else if (value instanceof VNode) {
            this.range.first.before(value);
        }
    }
    /**
     * Remove everything within the current range.
     */
    removeSelection(): void {
        let firstNode = this.range.first;
        this.range.selectedNodes.slice().forEach(vNode => {
            // If the node has children, chain them after the first range node.
            vNode.children.slice().forEach(child => {
                firstNode.after(child);
                firstNode = child;
            });
            // Then remove.
            vNode.remove();
        });
        this.range.collapse(); // Ensure the direction is right.
    }
    /**
     * Remove at range, in the given direction, or remove the selection if there
     * is one.
     *
     * @param direction
     */
    removeSide(direction: 'backward' | 'forward'): void {
        if (!this.range.collapsed) {
            this.removeSelection();
        } else {
            this._removeSide(direction);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Insert the given text at range.
     *
     * @param text
     */
    _insertText(text: string): void {
        // Split the text into CHAR nodes and insert them before the first range
        // node.
        let lastPosition = this.range.first;
        text.split('').forEach(char => {
            const vNode = new VNode(VNodeType.CHAR, '#text', char);
            lastPosition.before(vNode);
            lastPosition = vNode;
        });
    }
    /**
     * Remove at range, in the given direction.
     *
     * @param direction
     */
    _removeSide(direction: 'backward' | 'forward'): void {
        const isBackward = direction === 'backward';
        const edge = isBackward ? this.range.first : this.range.last;
        const siblingName = isBackward ? 'previousSibling' : 'nextSibling';
        if (edge[siblingName]) {
            edge[siblingName].remove();
        } else if (edge.parent && edge.parent[siblingName]) {
            let lastPosition = isBackward ? edge.parent[siblingName].lastLeaf : edge;
            const parent = isBackward ? edge.parent : edge.parent[siblingName];
            parent.children.slice().forEach(child => {
                if (lastPosition.properties.atomic) {
                    lastPosition.after(child);
                } else {
                    lastPosition.append(child);
                }
                lastPosition = child;
            });
            parent.remove();
        }
    }
}
