import { VNode, RelativePosition, Point } from './VNodes/VNode';
import { Predicate } from './VNodes/VNode';
import { MarkerNode } from './VNodes/MarkerNode';
import { Constructor } from '../../utils/src/utils';
import { FragmentNode } from './VNodes/FragmentNode';
import { ContainerNode } from './VNodes/ContainerNode';
import { AbstractNode } from './VNodes/AbstractNode';
import { TableCellNode } from '../../plugin-table/src/TableCellNode';
import { Mode, RuleProperty } from './Mode';
import { Modifiers } from './Modifiers';
import JWEditor from './JWEditor';
import { SeparatorNode } from './VNodes/SeparatorNode';

interface VRangeOptions {
    temporary?: boolean;
    mode?: Mode;
}

export class VRange {
    readonly start = new MarkerNode();
    readonly end = new MarkerNode();
    /**
     * Mark the range as being temporary to signal the system to remove it
     * when necessary.
     */
    temporary: boolean;
    /**
     * Modifiers applied to the range will affect the rendering of range.start.
     * It works as a sort of a cache for the current editing modifiers. Using
     * the `modifiers` property of the start node would be too dangerous as any
     * command might erroneously push modifiers in there without realizing they
     * just messed with the cache. This value is reset each time the range
     * changes in a document.
     */
    private _modifiers: Modifiers | undefined;
    private readonly _mode: Mode | undefined;

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

    constructor(
        public readonly editor: JWEditor,
        boundaryPoints?: [Point, Point],
        options: VRangeOptions = {},
    ) {
        this.temporary = !!options.temporary;
        this._mode = options.mode;
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

    get mode(): Mode {
        return this._mode || this.editor.mode;
    }

    /**
     * Each time the selection changes, we reset its format and style.
     * Get the modifiers for the next insertion.
     */
    get modifiers(): Modifiers {
        if (this._modifiers === undefined) {
            this._updateModifiers();
        }
        return this._modifiers;
    }
    set modifiers(modifiers: Modifiers | undefined) {
        this._modifiers = modifiers;
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
        const childVNodes = this.start.parent.childVNodes;
        let index = childVNodes.indexOf(this.end);
        while (index > 0) {
            index--;
            const sibling = childVNodes[index];
            if (sibling === this.start) {
                return true;
            }
            if (sibling.tangible) {
                break;
            }
        }
        return false;
    }
    /**
     * Return true if the start or end of the range is contained within the
     * given container.
     *
     * @param container
     */
    isIn(container: VNode): boolean {
        let startAncestor: VNode = this.start;
        let endAncestor: VNode = this.end;
        while (startAncestor || endAncestor) {
            if (startAncestor === container || endAncestor === container) {
                return true;
            }
            startAncestor = startAncestor?.parent;
            endAncestor = endAncestor?.parent;
        }
        return false;
    }
    /**
     * Return a list of all nodes that are fully selected by this range.
     */
    selectedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    selectedNodes(predicate?: Predicate): VNode[];
    selectedNodes(predicate?: Predicate): VNode[] {
        const selectedNodes: VNode[] = [];
        let node = this.start;
        const bound = this.end.next();
        const endContainers = this.end.ancestors();
        while ((node = node.next()) && node !== bound) {
            if (
                !endContainers.includes(node) &&
                !(node instanceof FragmentNode) &&
                this.mode.is(node, RuleProperty.EDITABLE) &&
                node?.test(predicate)
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
                const allChildrenSelected = ancestor
                    .children()
                    .every(child => selectedNodes.includes(child));
                if (
                    allChildrenSelected &&
                    !selectedNodes.includes(ancestor) &&
                    !(ancestor instanceof FragmentNode) &&
                    this.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    ancestor.test(predicate)
                ) {
                    selectedNodes.push(ancestor);
                }
            }
        }
        return selectedNodes;
    }
    /**
     * Return a list of all the nodes currently targeted by the range. If the
     * range is collapsed, the targeted node is the container of the range.
     * Otherwise, the targeted nodes are the ones encountered by traversing the
     * tree from the start to end of this range, together with the start
     * container.
     */
    targetedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    targetedNodes(predicate?: Predicate): VNode[];
    targetedNodes(predicate?: Predicate): VNode[] {
        const targetedNodes: VNode[] = this.traversedNodes(predicate);
        if (
            !this.end.previousSibling() &&
            targetedNodes.length &&
            targetedNodes[targetedNodes.length - 1] === this.endContainer
        ) {
            // When selecting a container and the space between it and the next
            // one (eg. triple click), don't return the next container as well.
            targetedNodes.pop();
        }
        const closestStartAncestor = this.start.ancestor(predicate);
        if (closestStartAncestor && this.mode.is(closestStartAncestor, RuleProperty.EDITABLE)) {
            targetedNodes.unshift(closestStartAncestor);
        } else if (closestStartAncestor) {
            const children = [...closestStartAncestor.childVNodes].reverse();
            for (const child of children) {
                if (
                    !targetedNodes.includes(child) &&
                    this.mode.is(child, RuleProperty.EDITABLE) &&
                    child.test(predicate)
                ) {
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
        const bound = this.end.next();
        while ((node = node.next()) && node !== bound) {
            if (this.mode.is(node, RuleProperty.EDITABLE) && node.test(predicate)) {
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
        if (reference instanceof ContainerNode && !reference.hasChildren()) {
            reference.prepend(this.start);
        } else if (position === RelativePosition.AFTER && reference !== this.end) {
            // We check that `reference` isn't `this.end` to avoid a backward
            // collapsed range.
            reference.after(this.start);
        } else if (position === RelativePosition.INSIDE) {
            reference.append(this.start);
        } else {
            reference.before(this.start);
        }
        this.modifiers = undefined;
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
        if (reference instanceof ContainerNode && !reference.hasChildren()) {
            reference.append(this.end);
        } else if (position === RelativePosition.BEFORE && reference !== this.start) {
            // We check that `reference` isn't `this.start` to avoid a backward
            // collapsed range.
            reference.before(this.end);
        } else if (position === RelativePosition.INSIDE) {
            reference.append(this.end);
        } else {
            reference.after(this.end);
        }
        this.modifiers = undefined;
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
        const ancestor = this.startContainer.commonAncestor(this.endContainer);
        const closest = ancestor.closest(predicate);
        const container = closest ? closest.parent : ancestor;

        // Split the start ancestors.
        let start: VNode = this.start;
        do {
            let startAncestor = start.parent;
            // Do not split at the start edge of a node.
            if (start.previousSibling() && this.mode.is(startAncestor, RuleProperty.BREAKABLE)) {
                startAncestor = startAncestor.splitAt(start);
            }
            start = startAncestor;
        } while (start.parent !== container);

        // Split the end ancestors.
        let end: VNode = this.end;
        do {
            const endAncestor = end.parent;
            // Do not split at the end edge of a node.
            if (end.nextSibling() && this.mode.is(endAncestor, RuleProperty.BREAKABLE)) {
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
            node = node.nextSibling();
        }
        nodes.push(end);
        return nodes;
    }
    /**
     * Empty the range by removing selected nodes and collapsing it by merging
     * nodes between start and end.
     */
    empty(): void {
        // Compute the current modifiers so they are preserved after empty.
        this._updateModifiers();
        const removableNodes = this.selectedNodes(node => {
            // TODO: Replace Table check with complex table selection support.
            return this.mode.is(node, RuleProperty.EDITABLE) && !(node instanceof TableCellNode);
        });
        // Remove selected nodes without touching the start range's ancestors.
        const startAncestors = this.start.ancestors();
        for (const node of removableNodes.filter(node => !startAncestors.includes(node))) {
            node.remove();
        }
        // Collapse the range by merging nodes between start and end, if it
        // doesn't traverse an unbreakable node.
        if (this.startContainer !== this.endContainer) {
            const commonAncestor = this.start.commonAncestor(this.end);
            const unbreakableStartAncestor = this.start.ancestor(this._isUnbreakable.bind(this));
            const traversedUnbreakables = this.traversedNodes(this._isUnbreakable.bind(this));
            if (
                unbreakableStartAncestor &&
                !this.end.ancestor(node => node === unbreakableStartAncestor)
            ) {
                traversedUnbreakables.unshift(unbreakableStartAncestor);
            }
            let ancestor = this.endContainer.parent;
            while (ancestor && ancestor !== commonAncestor) {
                if (
                    traversedUnbreakables.length === 0 &&
                    ancestor.children().length > 1 &&
                    this.endContainer.parent === ancestor &&
                    this.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    this.mode.is(this.startContainer, RuleProperty.EDITABLE) &&
                    this.mode.is(this.startContainer, RuleProperty.BREAKABLE)
                ) {
                    ancestor.splitAt(this.endContainer);
                }
                if (
                    traversedUnbreakables.length === 0 &&
                    this.mode.is(this.endContainer, RuleProperty.EDITABLE) &&
                    this.mode.is(this.endContainer, RuleProperty.BREAKABLE) &&
                    this.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    this.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    this.mode.is(this.startContainer, RuleProperty.EDITABLE) &&
                    this.mode.is(this.startContainer, RuleProperty.BREAKABLE)
                ) {
                    this.endContainer.mergeWith(ancestor);
                }
                ancestor = ancestor.parent;
            }
            if (
                traversedUnbreakables.length === 0 &&
                this.mode.is(this.startContainer, RuleProperty.BREAKABLE) &&
                this.mode.is(this.endContainer, RuleProperty.BREAKABLE) &&
                this.mode.is(this.startContainer, RuleProperty.EDITABLE) &&
                this.mode.is(this.endContainer, RuleProperty.EDITABLE)
            ) {
                this.endContainer.mergeWith(this.startContainer);
            }
            this.collapse();
        }
    }
    /**
     * Remove this range from its VDocument.
     */
    remove(): void {
        this.start.remove();
        this.end.remove();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given node is unbreakable.
     *
     * @param node
     */
    _isUnbreakable(node: VNode): boolean {
        return !this.mode.is(node, RuleProperty.BREAKABLE);
    }
    /**
     * Update the `_modifiers` cache by recomputing their current state based on
     * the surroundings of the current range.
     */
    private _updateModifiers(): void {
        let nodeToCopyModifiers: VNode;
        if (this.isCollapsed()) {
            nodeToCopyModifiers = this.start.previousSibling() || this.start.nextSibling();
        } else {
            nodeToCopyModifiers = this.start.nextSibling();
        }
        let modifiers: Modifiers = new Modifiers();
        if (nodeToCopyModifiers) {
            modifiers = nodeToCopyModifiers.modifiers.clone();
        }
        if (this.isCollapsed()) {
            // Only preserved modifiers are applied at the start of a container.
            const previousSibling = this.start.previousSibling();
            const nextSibling = this.end.nextSibling();
            const isAfterLineBreak = previousSibling instanceof SeparatorNode;
            const preservedModifiers = modifiers?.filter(mod => {
                if (isAfterLineBreak) {
                    return mod.preserveAfterLineBreak;
                } else if (previousSibling) {
                    return (
                        mod.preserveAfterNode ||
                        nextSibling?.modifiers?.some(otherMod => otherMod.isSameAs(mod))
                    );
                } else {
                    return mod.preserveAfterParagraphBreak;
                }
            });
            if (preservedModifiers?.length) {
                modifiers = new Modifiers(...preservedModifiers);
            } else {
                modifiers = new Modifiers();
            }
        }
        this._modifiers = modifiers;
    }
}
