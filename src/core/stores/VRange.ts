import { VNode, VNodeType } from './VNode';
import { VDocument } from './VDocument';

export enum Direction {
    BACKWARD = 'BACKWARD',
    FORWARD = 'FORWARD',
}
export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}
export interface VRangeDescription {
    start: VNode;
    startPosition?: RelativePosition;
    end?: VNode;
    endPosition?: RelativePosition;
    direction: Direction;
}

export class VRange {
    readonly start = new VNode(VNodeType.RANGE_START);
    readonly end = new VNode(VNodeType.RANGE_END);
    /**
     * The direction of the range depends on whether start is before end or the
     * opposite. This is costly to compute and, as such, is only computed when
     * needed by the `direction` getter. The `_direction` variable is the cache
     * for this computation, as the direction will not change anymore until the
     * range is changed, at which point this cache will be invalidated.
     */
    _direction: Direction;
    constructor(direction: Direction = Direction.FORWARD) {
        this._direction = direction;
    }
    get direction(): Direction {
        if (!this._direction) {
            const forward = VDocument.withRange(() => this.start.isBefore(this.end));
            this._direction = forward ? Direction.FORWARD : Direction.BACKWARD;
        }
        return this._direction;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the range is collapsed.
     */
    isCollapsed(): boolean {
        return VDocument.withRange(() => {
            if (this.direction === Direction.FORWARD) {
                return this.start.nextSibling() === this.end;
            } else {
                return this.end.nextSibling() === this.start;
            }
        });
    }
    /**
     * Return a list of all the nodes implied in the selection between the first
     * range node to the last (non-included).
     */
    get selectedNodes(): VNode[] {
        const selectedNodes: VNode[] = [];
        const next = this.direction === Direction.FORWARD ? 'next' : 'previous';
        const push = this.direction === Direction.FORWARD ? 'push' : 'unshift';
        let node = this.start;
        VDocument.withRange(() => {
            while ((node = node[next]()) && node !== this.end) {
                selectedNodes[push](node);
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
     * @param [edge] edge on which to collapse ('start' or 'end')
     *               default: 'start'
     */
    collapse(edge: 'start' | 'end' = 'start'): VRange {
        if (edge === 'start') {
            this.setEnd(this.start);
        } else {
            this.setStart(this.end);
        }
        // When collapsing, we always set the end after the start
        this._direction = Direction.FORWARD;
        return this;
    }
    /**
     * Update the range according to the given description. Return self.
     *
     * @param range
     */
    set(range: VRangeDescription): VRange {
        if (range.direction === Direction.FORWARD) {
            this.select(range.start, range.startPosition, range.end, range.endPosition);
        } else {
            this.select(range.end, range.endPosition, range.start, range.startPosition);
        }
        // If it is known, use of the given direction to populate the cache.
        if (range.direction) {
            this._direction = range.direction;
        }
        return this;
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
        return this.setStart(reference, position).collapse();
    }
    /**
     * Set a range selecting the given nodes.
     * Consider `ab` (▶ = `this._start`, ◀ = `this._end`):
     * `select(a)` => `▶a◀b`
     * `select(a, b)` => `▶ab◀`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `▶a◀b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a▶◀b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `▶ab◀`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a▶b◀`
     *
     * @param startNode
     * @param [startPosition] default: `RelativePosition.BEFORE`
     * @param [endNode] default: `startNode`
     * @param [endPosition] default: `RelativePosition.AFTER`
     */
    select(startNode: VNode, endNode?: VNode): VRange;
    select(
        startNode: VNode,
        startPosition: RelativePosition,
        endNode: VNode,
        endPosition: RelativePosition,
    ): VRange;
    select(
        startNode: VNode,
        startPosition: RelativePosition | VNode = RelativePosition.BEFORE,
        endNode: VNode = startNode,
        endPosition: RelativePosition = RelativePosition.AFTER,
    ): VRange {
        if (startPosition instanceof VNode) {
            endNode = startPosition;
            startPosition = RelativePosition.BEFORE;
        }
        if (endPosition === RelativePosition.AFTER) {
            this.setEnd(endNode, endPosition);
            this.setStart(startNode, startPosition);
        } else {
            this.setStart(startNode, startPosition);
            this.setEnd(endNode, endPosition);
        }
        return this;
    }
    /**
     * Set the start of the range by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param position
     * @param reference
     */
    setStart(reference: VNode, position = RelativePosition.BEFORE): VRange {
        reference = reference.firstLeaf();
        if (position === RelativePosition.AFTER && reference !== this.end) {
            reference.after(this.start);
        } else {
            reference.before(this.start);
        }
        this._direction = null; // Invalidate range direction cache.
        return this;
    }
    /**
     * Set the end of the range by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. If no relative position if given, include the
     * reference node in the selection. Return self.
     *
     * @param position
     * @param reference
     */
    setEnd(reference: VNode, position = RelativePosition.AFTER): VRange {
        reference = reference.lastLeaf();
        if (position === RelativePosition.BEFORE && reference !== this.start) {
            reference.before(this.end);
        } else {
            reference.after(this.end);
        }
        this._direction = null; // Invalidate range direction cache.
        return this;
    }
}
