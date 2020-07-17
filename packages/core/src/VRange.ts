import { VNode, RelativePosition, Point } from './VNodes/VNode';
import { Predicate } from './VNodes/VNode';
import { MarkerNode } from './VNodes/MarkerNode';
import { Constructor } from '../../utils/src/utils';
import { FragmentNode } from './VNodes/FragmentNode';
import { ContainerNode } from './VNodes/ContainerNode';
import {
    AbstractNode,
    isNodePredicate,
    testNodePredicate,
    isBeforeNode,
    commonAncestorNodesTemp,
} from './VNodes/AbstractNode';
import { TableCellNode } from '../../plugin-table/src/TableCellNode';
import { nextNodeTemp, afterNodeTemp, beforeNodeTemp, removeNodeTemp } from './VNodes/AbstractNode';
import {
    previousSiblingNodeTemp,
    nextSiblingNodeTemp,
    previousNodeTemp,
} from './VNodes/AbstractNode';
import {
    isAfterNode,
    closestNode,
    ancestorNodeTemp,
    ancestorsNodesTemp,
} from './VNodes/AbstractNode';

export class VRange {
    readonly start = new MarkerNode();
    readonly end = new MarkerNode();

    /**
     * Return the context of a collapsed range at the given location, targetting
     * a reference VNode and specifying the position relative to that VNode.
     *
     * @param reference
     * @param position
     */
    static at(reference: VNode, position = RelativePosition.BEFORE): [Point, Point] {
        return VRange.selecting(reference, position, reference, position);
    }
    /**
     * Return the context of a range at the location of the given range.
     *
     * @param range
     */
    static clone(range: VRange): [Point, Point] {
        return [
            [range.start, RelativePosition.BEFORE],
            [range.end, RelativePosition.AFTER],
        ];
    }
    /**
     * Return the context of a range selecting the given nodes.
     * Consider `ab` (`[` = start, `]` = end):
     * `select(a)` => `[a]b`
     * `select(a, b)` => `[ab]`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `[a]b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a[]b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `[ab]`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a[b]`
     *
     * @param startNode
     * @param [startPosition] default: `RelativePosition.BEFORE`
     * @param [endNode] default: `startNode`
     * @param [endPosition] default: `RelativePosition.AFTER`
     */
    static selecting(startNode: VNode, endNode?: VNode): [Point, Point];
    static selecting(
        startNode: VNode,
        startPosition: RelativePosition,
        endNode: VNode,
        endPosition: RelativePosition,
    ): [Point, Point];
    static selecting(
        startNode: VNode,
        startPosition: RelativePosition | VNode = RelativePosition.BEFORE,
        endNode: VNode = startNode,
        endPosition: RelativePosition = RelativePosition.AFTER,
    ): [Point, Point] {
        if (startPosition instanceof AbstractNode) {
            endNode = startPosition;
            startPosition = RelativePosition.BEFORE;
        }
        return [
            [startNode, startPosition],
            [endNode, endPosition],
        ];
    }

    constructor(boundaryPoints?: [Point, Point]) {
        // If a range context is given, adapt this range to match it.
        if (boundaryPoints) {
            const [start, end] = boundaryPoints;
            const [startNode, startPosition] = start;
            const [endNode, endPosition] = end;
            if (endPosition === RelativePosition.AFTER) {
                this.setEnd(endNode, endPosition);
                this.setStart(startNode, startPosition);
            } else {
                this.setStart(startNode, startPosition);
                this.setEnd(endNode, endPosition);
            }
        }
    }

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
        if (!this.startContainer || !this.endContainer) return;
        const startIndex = this.start.parent.childVNodes.indexOf(this.start);
        return this.startContainer.childVNodes[startIndex + 1] === this.end;
    }
    /**
     * Return a list of all nodes that are fully selected by this range.
     */
    selectedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    selectedNodes(predicate?: Predicate): VNode[];
    selectedNodes(predicate?: Predicate): VNode[] {
        const selectedNodes: VNode[] = [];
        let node = this.start;
        const bound = nextNodeTemp(this.end);
        const endContainers = ancestorsNodesTemp(this.end);
        while ((node = nextNodeTemp(node)) && node !== bound) {
            if (
                !endContainers.includes(node) &&
                !(node instanceof FragmentNode) &&
                node.editable &&
                testNodePredicate(node, predicate)
            ) {
                selectedNodes.push(node);
            }
        }
        const alreadyTested = new Set<VNode>();
        for (const selectedNode of selectedNodes) {
            // Find the next ancestor whose children are all selected
            // and add it to the list.
            // TODO: Ideally, selected nodes should be returned in DFS order.
            const ancestor = selectedNode.parent;
            if (ancestor && !alreadyTested.has(ancestor)) {
                alreadyTested.add(ancestor);
                if (ancestor.children().every(child => selectedNodes.includes(child))) {
                    if (!selectedNodes.includes(ancestor)) {
                        selectedNodes.push(ancestor);
                    }
                }
            }
        }
        return selectedNodes;
    }
    /**
     * Return a list of all the nodes currently targeted by the range. If the
     * range is collapsed, the targeted node is the container of the range.
     * Otherwise, the targeted nodes are the ones encountered by traversing the
     * tree from the start to end of this range.
     */
    targetedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    targetedNodes(predicate?: Predicate): VNode[];
    targetedNodes(predicate?: Predicate): VNode[] {
        const targetedNodes: VNode[] = this.traversedNodes(predicate);
        if (!previousSiblingNodeTemp(this.end)) {
            // When selecting a container and the space between it and the next
            // one (eg. triple click), don't return the next container as well.
            targetedNodes.pop();
        }
        const closestStartAncestor = ancestorNodeTemp(this.start, predicate);
        if (closestStartAncestor?.editable) {
            targetedNodes.unshift(closestStartAncestor);
        } else if (closestStartAncestor) {
            const children = [...closestStartAncestor.childVNodes].reverse();
            for (const child of children) {
                if (!targetedNodes.includes(child) && testNodePredicate(child, predicate)) {
                    targetedNodes.unshift(child);
                }
            }
        }
        return targetedNodes;
    }

    /**
     * Return a list of all the nodes traversed from start to end of this range.
     */
    traversedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    traversedNodes(predicate?: Predicate): VNode[];
    traversedNodes(predicate?: Predicate): VNode[] {
        const traversedNodes = [];
        let node = this.start;
        const bound = nextNodeTemp(this.end);
        while ((node = nextNodeTemp(node)) && node !== bound) {
            if (node.editable && testNodePredicate(node, predicate)) {
                traversedNodes.push(node);
            }
        }
        return traversedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Collapse the range.
     *
     * @param [edge] range edge on which to collapse
     */
    collapse(edge = this.start): void {
        if (edge === this.start) {
            this.setEnd(edge);
        } else if (edge === this.end) {
            this.setStart(edge);
        }
    }
    /**
     * Set the range's start point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath.
     *
     * @param reference
     * @param [position]
     */
    setStart(reference: VNode, position = RelativePosition.BEFORE): void {
        if (position === RelativePosition.BEFORE) {
            reference = reference.firstLeaf();
        } else if (position === RelativePosition.AFTER) {
            reference = reference.lastLeaf();
        }
        if (isNodePredicate(reference, ContainerNode) && !reference.hasChildren()) {
            reference.prepend(this.start);
        } else if (position === RelativePosition.AFTER && reference !== this.end) {
            // We check that `reference` isn't `this.end` to avoid a backward
            // collapsed range.
            afterNodeTemp(reference, this.start);
        } else if (position === RelativePosition.INSIDE) {
            reference.append(this.start);
        } else {
            beforeNodeTemp(reference, this.start);
        }
    }
    /**
     * Set the range's end point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath.
     *
     * @param reference
     * @param [position]
     */
    setEnd(reference: VNode, position = RelativePosition.AFTER): void {
        if (position === RelativePosition.BEFORE) {
            reference = reference.firstLeaf();
        } else if (position === RelativePosition.AFTER) {
            reference = reference.lastLeaf();
        }
        if (isNodePredicate(reference, ContainerNode) && !reference.hasChildren()) {
            reference.append(this.end);
        } else if (position === RelativePosition.BEFORE && reference !== this.start) {
            // We check that `reference` isn't `this.start` to avoid a backward
            // collapsed range.
            beforeNodeTemp(reference, this.end);
        } else if (position === RelativePosition.INSIDE) {
            reference.append(this.end);
        } else {
            afterNodeTemp(reference, this.end);
        }
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
    extendTo(targetNode: VNode): void {
        let position: RelativePosition;
        if (isBeforeNode(targetNode, this.start)) {
            targetNode = previousNodeTemp(targetNode);
            if (targetNode.hasChildren()) {
                targetNode = targetNode.firstLeaf();
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
            if (targetNode && nextSiblingNodeTemp(this.end) !== targetNode) {
                this.setStart(targetNode, position);
            }
        } else if (isAfterNode(targetNode, this.end)) {
            if (targetNode.hasChildren()) {
                targetNode = nextNodeTemp(targetNode);
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
            if (targetNode) {
                this.setEnd(targetNode, position);
            }
        }
    }
    /**
     * Split the range containers up to their common ancestor. Return all
     * children of the common ancestor that are targeted by the range after the
     * split. If a predicate is given, splitting continues up to and including
     * the node closest to the common ancestor that matches the predicate.
     *
     * @param predicate
     */
    split(predicate?: Predicate): VNode[] {
        const ancestor = commonAncestorNodesTemp(this.startContainer, this.endContainer);
        const closest = closestNode(ancestor, predicate);
        const container = closest ? closest.parent : ancestor;

        // Split the start ancestors.
        let start: VNode = this.start;
        do {
            let startAncestor = start.parent;
            // Do not split at the start edge of a node.
            if (previousSiblingNodeTemp(start)) {
                startAncestor = startAncestor.splitAt(start);
            }
            start = startAncestor;
        } while (start.parent !== container);

        // Split the end ancestors.
        let end: VNode = this.end;
        do {
            const endAncestor = end.parent;
            // Do not split at the end edge of a node.
            if (nextSiblingNodeTemp(end)) {
                endAncestor.splitAt(end);
                endAncestor.append(end);
            }
            end = endAncestor;
        } while (end.parent !== container);

        // Return all top-most split nodes between and including start and end.
        const nodes = [];
        let node = start;
        while (node !== end) {
            nodes.push(node);
            node = nextSiblingNodeTemp(node);
        }
        nodes.push(end);
        return nodes;
    }
    /**
     * Empty the range by removing selected nodes and collapsing it by merging
     * nodes between start and end.
     */
    empty(): void {
        const removableNodes = this.selectedNodes(
            (node: VNode) =>
                /* TODO: Replace this check by complex table selection support.*/ node.breakable ||
                node.parent?.breakable ||
                !isNodePredicate(node, TableCellNode),
        );
        // Remove selected nodes without touching the start range's ancestors.
        const startAncestors = ancestorsNodesTemp(this.start);
        for (const node of removableNodes.filter(node => !startAncestors.includes(node))) {
            removeNodeTemp(node);
        }
        // Collapse the range by merging nodes between start and end.
        if (this.startContainer !== this.endContainer) {
            const commonAncestor = commonAncestorNodesTemp(this.start, this.end);
            let ancestor = this.endContainer.parent;
            while (ancestor !== commonAncestor) {
                if (ancestor.children().length > 1) {
                    ancestor.splitAt(this.endContainer);
                }
                if (this.endContainer.breakable) {
                    this.endContainer.mergeWith(ancestor);
                }
                ancestor = ancestor.parent;
            }
            if (this.endContainer.breakable) {
                this.endContainer.mergeWith(this.startContainer);
            }
        }
    }
    /**
     * Remove this range from its VDocument.
     */
    remove(): void {
        removeNodeTemp(this.start);
        removeNodeTemp(this.end);
    }
}

/**
 * Create a temporary range corresponding to the given boundary points and
 * call the given callback with the newly created range as argument. The
 * range is automatically destroyed after calling the callback.
 *
 * @param bounds The points corresponding to the range boundaries.
 * @param callback The callback to call with the newly created range.
 */
export async function withRange<T>(
    bounds: [Point, Point],
    callback: (range: VRange) => T,
): Promise<T> {
    const range = new VRange(bounds);
    const result = await callback(range);
    range.remove();
    return result;
}
