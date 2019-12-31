import { VNode, RelativePosition, Constructor, Predicate, NodePredicate } from './VNodes/VNode';
import { withMarkers } from '../../utils/src/markers';
import { MarkerNode } from './VNodes/MarkerNode';

export class VRange {
    readonly start = new MarkerNode();
    readonly end = new MarkerNode();

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    get startContainer(): VNode {
        return this.start.parent;
    }

    get endContainer(): VNode {
        return this.end.parent;
    }

    /**
     * Return true if the range is collapsed.
     */
    isCollapsed(): boolean {
        return withMarkers(() => this.start.nextSibling() === this.end);
    }
    /**
     * Return a list of all the nodes between the start and end of this range.
     */
    selectedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    selectedNodes(predicate?: Predicate): VNode[];
    selectedNodes<T extends VNode>(predicate?: NodePredicate<T>): VNode[] {
        const selectedNodes: VNode[] = [];
        let node = this.start;
        withMarkers(() => {
            while ((node = node.next()) && node !== this.end) {
                if (node.test(predicate)) {
                    selectedNodes.push(node);
                }
            }
        });
        return selectedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Collapse the range. Return self.
     *
     * @param [edge] range edge on which to collapse
     */
    collapse(edge = this.start): this {
        if (edge === this.start) {
            this.setEnd(edge);
        } else if (edge === this.end) {
            this.setStart(edge);
        }
        return this;
    }
    /**
     * Set the range's start point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath.
     * Return self.
     *
     * @param reference
     * @param [position]
     */
    setStart(reference: VNode, position = RelativePosition.BEFORE): this {
        reference = reference.firstLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.prepend(this.start);
        } else if (position === RelativePosition.AFTER && reference !== this.end) {
            // We check that `reference` isn't `this.end` to avoid a backward
            // collapsed range.
            reference.after(this.start);
        } else {
            reference.before(this.start);
        }
        return this;
    }
    /**
     * Set the range's end point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath.
     * Return self.
     *
     * @param reference
     * @param [position]
     */
    setEnd(reference: VNode, position = RelativePosition.AFTER): this {
        reference = reference.lastLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.append(this.end);
        } else if (position === RelativePosition.BEFORE && reference !== this.start) {
            // We check that `reference` isn't `this.start` to avoid a backward
            // collapsed range.
            reference.before(this.end);
        } else {
            reference.after(this.end);
        }
        return this;
    }
    /**
     * Extend this range in such a way that it includes the given node.
     *
     * This method moves the boundary marker that is closest to the given node
     * up or down the tree in order to include the given node into the range.
     * Because of that, calling this method will always result in a range that
     * is at least the size that it was prior to calling it, and usually bigger.
     *
     * @param targetNode The node to extend the range to.
     */
    extendTo(targetNode: VNode): this {
        let position: RelativePosition;
        if (targetNode.isBefore(this.start)) {
            targetNode = targetNode.previous();
            if (targetNode.hasChildren()) {
                targetNode = targetNode.firstLeaf();
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
            if (targetNode && this.end.nextSibling() !== targetNode) {
                this.setStart(targetNode, position);
            }
        } else if (targetNode.isAfter(this.end)) {
            if (targetNode.hasChildren()) {
                targetNode = targetNode.next();
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
            if (targetNode) {
                this.setEnd(targetNode, position);
            }
        }
        return this;
    }
    /**
     * Remove this range from its VDocument.
     */
    remove(): void {
        this.start.remove();
        this.end.remove();
    }
}
