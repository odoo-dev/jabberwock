import { VNode } from './VNodes/VNode';
import { RelativePosition, Direction } from '../../utils/src/selection';
import { MarkerNode } from './VNodes/MarkerNode';
import { withMarkers } from '../../utils/src/markers';

export interface VSelectionDescription {
    anchorNode: VNode;
    anchorPosition: RelativePosition;
    focusNode: VNode;
    focusPosition: RelativePosition;
}

export class VSelection {
    readonly anchor = new MarkerNode();
    readonly focus = new MarkerNode();
    /**
     * The direction of the selection depends on whether the anchor node is
     * before the focus node or the opposite. If the anchor node is before the
     * focus node, the selection is forward, otherwise it is backward.
     */
    get direction(): Direction {
        const forward = withMarkers(() => this.anchor.isBefore(this.focus));
        return forward ? Direction.FORWARD : Direction.BACKWARD;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the selection is collapsed.
     */
    isCollapsed(): boolean {
        return withMarkers(() => {
            if (this.direction === Direction.FORWARD) {
                return this.anchor.nextSibling() === this.focus;
            } else {
                return this.focus.nextSibling() === this.anchor;
            }
        });
    }
    /**
     * Return a list of all the nodes currently selected, that is all nodes
     * located between the anchor node and the focus node of this selection.
     */
    get selectedNodes(): VNode[] {
        const selectedNodes: VNode[] = [];
        const forward = this.direction === Direction.FORWARD;
        const start = forward ? this.anchor : this.focus;
        const end = forward ? this.focus : this.anchor;
        let node = start;
        withMarkers(() => {
            while ((node = node.next()) && node !== end) {
                selectedNodes.push(node);
            }
        });
        return selectedNodes;
    }
    /**
     * Collapse the selection. Return self.
     *
     * @param [edge] marker node on which to collapse the selection
     */
    collapse(edge = this.anchor): this {
        if (edge === this.anchor) {
            this.setFocus(edge);
        } else {
            this.setAnchor(edge);
        }
        return this;
    }
    /**
     * Update the selection according to the given description. Return self.
     *
     * @param selection
     */
    set(selection: VSelectionDescription): this {
        return this.select(
            selection.anchorNode,
            selection.anchorPosition,
            selection.focusNode,
            selection.focusPosition,
        );
    }
    /**
     * Set a collapsed selection at the given location, targetting a `reference`
     * VNode and specifying the `position` in reference to that VNode ('BEFORE',
     * 'AFTER'), like in an `xpath`. Return self.
     *
     * @param position
     * @param reference
     */
    setAt(reference: VNode, position = RelativePosition.BEFORE): this {
        return this.setAnchor(reference, position).collapse();
    }
    /**
     * Set the selection such that it is selecting the given nodes.
     * Consider `ab` ([ = `this.anchor`, ] = `this.focus`):
     * `select(a)` => `[a]b`
     * `select(a, b)` => `[ab]`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `[a]b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a[]b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `[ab]`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a[b]`
     *
     * @param anchorNode
     * @param [anchorPostion] default: `RelativePosition.BEFORE`
     * @param [focusNode] default: `anchorNode`
     * @param [focusPosition] default: `RelativePosition.AFTER`
     */
    select(anchorNode: VNode, focusNode?: VNode): this;
    select(
        anchorNode: VNode,
        anchorPostion: RelativePosition,
        focusNode: VNode,
        focusPosition: RelativePosition,
    ): this;
    select(
        anchorNode: VNode,
        anchorPosition: RelativePosition | VNode = RelativePosition.BEFORE,
        focusNode: VNode = anchorNode,
        focusPosition: RelativePosition = RelativePosition.AFTER,
    ): this {
        if (anchorPosition instanceof VNode) {
            focusNode = anchorPosition;
            anchorPosition = RelativePosition.BEFORE;
        }
        if (focusPosition === RelativePosition.AFTER) {
            this.setFocus(focusNode, focusPosition);
            this.setAnchor(anchorNode, anchorPosition);
        } else {
            this.setAnchor(anchorNode, anchorPosition);
            this.setFocus(focusNode, focusPosition);
        }
        return this;
    }
    /**
    /**
     * Set the anchor of the selection by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    setAnchor(reference: VNode, position = RelativePosition.BEFORE): this {
        reference = reference.firstLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.prepend(this.anchor);
        } else if (position === RelativePosition.AFTER && reference !== this.focus) {
            // We check that `reference` isn't `_head` to avoid a backward
            // collapsed selection.
            reference.after(this.anchor);
        } else {
            reference.before(this.anchor);
        }
        return this;
    }
    /**
     * Set the focus of the selection by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    setFocus(reference: VNode, position = RelativePosition.AFTER): this {
        reference = reference.lastLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.append(this.focus);
        } else if (position === RelativePosition.BEFORE && reference !== this.anchor) {
            // We check that `reference` isn't `_tail` to avoid a backward
            // collapsed selection.
            reference.before(this.focus);
        } else {
            reference.after(this.focus);
        }
        return this;
    }
    /**
     * Extend the selection from its anchor to the given location, targetting a
     * `reference` VNode and specifying the `direction` of the extension.
     *
     * @param reference
     * @param [direction] default: Direction.FORWARD
     * @see _setHead
     */
    extendTo(reference: VNode, direction = Direction.FORWARD): void {
        let position: RelativePosition;
        if (direction === Direction.FORWARD) {
            if (reference.hasChildren()) {
                reference = reference.next();
                reference = reference.firstLeaf();
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
        } else {
            reference = reference.previous();
            if (reference.hasChildren()) {
                reference = reference.firstLeaf();
                position = RelativePosition.BEFORE;
            } else {
                position = RelativePosition.AFTER;
            }
        }
        if (reference) {
            this.setFocus(reference, position);
        }
    }
}
