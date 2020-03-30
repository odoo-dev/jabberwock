import { VRange } from './VRange';
import { VNode, RelativePosition } from './VNodes/VNode';
import { MarkerNode } from './VNodes/MarkerNode';
import { AbstractNode } from './VNodes/AbstractNode';

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

    get anchor(): MarkerNode {
        return this.direction === Direction.FORWARD ? this.range.start : this.range.end;
    }

    get focus(): MarkerNode {
        return this.direction === Direction.FORWARD ? this.range.end : this.range.start;
    }

    get direction(): Direction {
        return this._direction;
    }

    isCollapsed(): boolean {
        return this.range.isCollapsed();
    }
    /**
     * Update the selection according to the given description.
     *
     * @param selection
     */
    set(selection: VSelectionDescription): void {
        this._direction = selection.direction;
        this.select(
            selection.anchorNode,
            selection.anchorPosition,
            selection.focusNode,
            selection.focusPosition,
        );
    }
    /**
     * Set a collapsed selection at the given location, targetting a `reference`
     * VNode and specifying the `position` in reference to that VNode ('BEFORE',
     * 'AFTER'), like in an `xpath`.
     *
     * @param position
     * @param reference
     */
    setAt(reference: VNode, position = RelativePosition.BEFORE): void {
        this.setAnchor(reference, position);
        this.collapse();
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
    select(anchorNode: VNode, focusNode?: VNode): void;
    select(
        anchorNode: VNode,
        anchorPosition: RelativePosition,
        focusNode: VNode,
        focusPosition: RelativePosition,
    ): void;
    select(
        anchorNode: VNode,
        anchorPosition: RelativePosition | VNode = RelativePosition.BEFORE,
        focusNode: VNode = anchorNode,
        focusPosition: RelativePosition = RelativePosition.AFTER,
    ): void {
        if (anchorPosition instanceof AbstractNode) {
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
    }
    /**
     * Set the anchor of the selection by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection.
     *
     * @param reference
     * @param [position]
     */
    setAnchor(reference: VNode, position = RelativePosition.BEFORE): void {
        if (this.direction === Direction.FORWARD) {
            this.range.setStart(reference, position);
        } else {
            this.range.setEnd(reference, position);
        }
    }
    /**
     * Set the focus of the selection by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection.
     *
     * @param reference
     * @param [position]
     */
    setFocus(reference: VNode, position = RelativePosition.AFTER): void {
        if (this.direction === Direction.FORWARD) {
            this.range.setEnd(reference, position);
        } else {
            this.range.setStart(reference, position);
        }
    }
    /**
     * Extend the selection from its anchor to the given location, targetting a
     * `reference` VNode and specifying the `direction` of the extension.
     *
     * @param reference
     * @param [direction] default: Direction.FORWARD
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
    /**
     * Collapse the selection on its anchor.
     *
     */
    collapse(): void {
        this.range.collapse(this.anchor);
    }
}
