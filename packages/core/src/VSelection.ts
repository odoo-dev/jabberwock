import { VNode } from './VNodes/VNode';
import { RelativePosition, Direction, withMarkers } from '../../utils/src/range';
import { RangeNode } from './VNodes/MarkerNode';

export interface VRangeDescription {
    anchorNode: VNode;
    anchorPosition: RelativePosition;
    focusNode: VNode;
    focusPosition: RelativePosition;
}

export class VRange {
    readonly anchor = new RangeNode();
    readonly focus = new RangeNode();
    /**
     * The direction of the range depends on whether tail is before head or the
     * opposite. This is costly to compute and, as such, is only computed when
     * needed by the `direction` getter.
     */
    get direction(): Direction {
        const forward = withMarkers(() => this.anchor.isBefore(this.focus));
        return forward ? Direction.FORWARD : Direction.BACKWARD;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the range is collapsed.
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
     * Return a list of all the nodes implied in the selection between the first
     * range node to the last (non-included).
     */
    get selectedNodes(): VNode[] {
        const selectedNodes: VNode[] = [];
        const start = this.direction === Direction.FORWARD ? this.anchor : this.focus;
        const end = this.direction === Direction.FORWARD ? this.focus : this.anchor;
        let node = start;
        withMarkers(() => {
            while ((node = node.next()) && node !== end) {
                selectedNodes.push(node);
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
     * @param [edge] range node on which to collapse
     */
    collapse(edge = this.anchor): VRange {
        if (edge === this.anchor) {
            this._setFocus(edge);
        } else {
            this._setAnchor(edge);
        }
        return this;
    }
    /**
     * Update the range according to the given description. Return self.
     *
     * @param range
     */
    set(selection: VRangeDescription): VRange {
        return this.select(
            selection.anchorNode,
            selection.anchorPosition,
            selection.focusNode,
            selection.focusPosition,
        );
    }
    /**
     * Set a collapsed range at the given location, targetting a `reference`
     * VNode and specifying the `position` in reference to that VNode ('BEFORE',
     * 'AFTER'), like in an `xpath`. Return self.
     *
     * @param position
     * @param reference
     */
    setAt(reference: VNode, position = RelativePosition.BEFORE): VRange {
        return this._setAnchor(reference, position).collapse();
    }
    /**
     * Set a range selecting the given nodes.
     * Consider `ab` ([ = `this.anchor`, ] = `this.focus`):
     * `select(a)` => `[a]b`
     * `select(a, b)` => `[ab]`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `[a]b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a[]b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `[ab]`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a[b]`
     *
     * @param tailNode
     * @param [anchorNode] default: `RelativePosition.BEFORE`
     * @param [focusNode] default: `anchorNode`
     * @param [focusOffset] default: `RelativePosition.AFTER`
     */
    select(anchorNode: VNode, focusNode?: VNode): VRange;
    select(
        anchorNode: VNode,
        anchorOffset: RelativePosition,
        focusNode: VNode,
        focusOffset: RelativePosition,
    ): VRange;
    select(
        anchorNode: VNode,
        anchorOffset: RelativePosition | VNode = RelativePosition.BEFORE,
        focusNode: VNode = anchorNode,
        focusOffset: RelativePosition = RelativePosition.AFTER,
    ): VRange {
        if (anchorOffset instanceof VNode) {
            focusNode = anchorOffset;
            anchorOffset = RelativePosition.BEFORE;
        }
        if (focusOffset === RelativePosition.AFTER) {
            this._setFocus(focusNode, focusOffset);
            this._setAnchor(anchorNode, anchorOffset);
        } else {
            this._setAnchor(anchorNode, anchorOffset);
            this._setFocus(focusNode, focusOffset);
        }
        return this;
    }
    /**
     * Set the range's start point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath`. If a direction is
     * specified, the range's start point will be the head of the range.
     * Return self.
     *
     * @param reference
     * @param [position]
     * @param [direction] default: Direction.FORWARD
     */
    setStart(reference: VNode, position?: RelativePosition, direction = Direction.FORWARD): VRange {
        if (direction === Direction.FORWARD) {
            return this._setAnchor(reference, position);
        } else {
            return this._setFocus(reference, position);
        }
    }
    /**
     * Set the range's end point (in traversal order) at the given location,
     * targetting a `reference` VNode and specifying the `position` in reference
     * to that VNode ('BEFORE', 'AFTER'), like in an `xpath`. If a direction is
     * specified, the range's end point will be the tail of the range.
     * Return self.
     *
     * @param reference
     * @param [position]
     * @param [direction] default: Direction.FORWARD
     */
    setEnd(reference: VNode, position?: RelativePosition, direction = Direction.FORWARD): VRange {
        if (direction === Direction.FORWARD) {
            return this._setFocus(reference, position);
        } else {
            return this._setAnchor(reference, position);
        }
    }
    /**
     * Set the start of the range by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    setAnchor(reference: VNode, position = RelativePosition.BEFORE): VRange {
        return this._setAnchor(reference, position);
    }
    /**
     * Set the end of the range by targetting a `reference` VNode and specifying
     * the `position` in reference to that VNode ('BEFORE', 'AFTER'), like in an
     * `xpath`. If no relative position if given, include the reference node in
     * the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    setFocus(reference: VNode, position = RelativePosition.AFTER): VRange {
        return this._setFocus(reference, position);
    }
    /**
     * Extend the range from its tail to the given location, targetting a
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
            this._setFocus(reference, position);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Set the end of the range by targetting a `reference` VNode and specifying
     * the `position` in reference to that VNode ('BEFORE', 'AFTER'), like in an
     * `xpath`. If no relative position if given, include the reference node in
     * the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    _setAnchor(reference: VNode, position = RelativePosition.BEFORE): VRange {
        reference = reference.firstLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.prepend(this.anchor);
        } else if (position === RelativePosition.AFTER && reference !== this.focus) {
            // We check that `reference` isn't `_head` to avoid a backward
            // collapsed range.
            reference.after(this.anchor);
        } else {
            reference.before(this.anchor);
        }
        return this;
    }
    /**
     * Set the end of the range by targetting a `reference` VNode and specifying
     * the `position` in reference to that VNode ('BEFORE', 'AFTER'), like in an
     * `xpath`. If no relative position if given, include the reference node in
     * the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    _setFocus(reference: VNode, position = RelativePosition.AFTER): VRange {
        reference = reference.lastLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.append(this.focus);
        } else if (position === RelativePosition.BEFORE && reference !== this.anchor) {
            // We check that `reference` isn't `_tail` to avoid a backward
            // collapsed range.
            reference.before(this.focus);
        } else {
            reference.after(this.focus);
        }
        return this;
    }
}
