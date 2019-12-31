import { VRange } from './VRange';
import { VNode, RelativePosition } from './VNodes/VNode';

export const ANCHOR_CHAR = '[';
export const FOCUS_CHAR = ']';

export enum Direction {
    BACKWARD = 'BACKWARD',
    FORWARD = 'FORWARD',
}

export interface VSelectionDescription {
    anchorNode: VNode;
    anchorPosition?: RelativePosition;
    focusNode?: VNode;
    focusPosition?: RelativePosition;
    direction: Direction;
}

export class VSelection {
    readonly range: VRange = new VRange();
    _direction: Direction = Direction.FORWARD;

    get anchor(): VNode {
        return this.direction === Direction.FORWARD ? this.range.start : this.range.end;
    }

    get focus(): VNode {
        return this.direction === Direction.FORWARD ? this.range.end : this.range.start;
    }

    get direction(): Direction {
        return this._direction;
    }

    isCollapsed(): boolean {
        return this.range.isCollapsed();
    }
    /**
     * Update the selection according to the given description. Return self.
     *
     * @param selection
     */
    set(selection: VSelectionDescription): this {
        this._direction = selection.direction;
        this.select(
            selection.anchorNode,
            selection.anchorPosition,
            selection.focusNode,
            selection.focusPosition,
        );
        return this;
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
     * Update the selection to select the given nodes.
     * Consider `ab` ([ = `this._start`, ] = `this._end`):
     * `select(a)` => `[a]b`
     * `select(a, b)` => `[ab]`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `[a]b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a[]b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `[ab]`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a[b]`
     *
     * @param anchorNode
     * @param [anchorPosition] default: `RelativePosition.BEFORE`
     * @param [focusNode] default: `startNode`
     * @param [focusPosition] default: `RelativePosition.AFTER`
     */
    select(anchorNode: VNode, focusNode?: VNode): this;
    select(
        anchorNode: VNode,
        anchorPosition: RelativePosition,
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
     * Set the anchor of the selection by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param reference
     * @param [position]
     */
    setAnchor(reference: VNode, position = RelativePosition.BEFORE): this {
        if (this.direction === Direction.FORWARD) {
            this.range.setStart(reference, position);
        } else {
            this.range.setEnd(reference, position);
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
        if (this.direction === Direction.FORWARD) {
            this.range.setEnd(reference, position);
        } else {
            this.range.setStart(reference, position);
        }
        return this;
    }
    /**
     * Extend the selection from its anchor to the given location, targetting a
     * `reference` VNode and specifying the `direction` of the extension.
     *
     * @param reference
     * @param [direction] default: Direction.FORWARD
     */
    extendTo(reference: VNode, direction = Direction.FORWARD): this {
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
        return this;
    }
    /**
     * Collapse the selection on its anchor. Return self.
     *
     */
    collapse(): this {
        this.range.collapse(this.anchor);
        return this;
    }
}
