import { VNode, VNodeType } from './VNode';

export enum RangeDirection {
    BACKWARD = 'BACKWARD',
    FORWARD = 'FORWARD',
}
export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}
export interface VRangeLocation {
    start: VNode;
    startPosition?: RelativePosition;
    end?: VNode;
    endPosition?: RelativePosition;
    direction: RangeDirection;
}

export class VRange {
    readonly _start = new VNode(VNodeType.RANGE_START);
    readonly _end = new VNode(VNodeType.RANGE_END);
    _direction: RangeDirection;
    constructor(direction: RangeDirection = RangeDirection.FORWARD) {
        this._direction = direction;
    }
    get direction(): RangeDirection {
        if (!this._direction) {
            const isForward = this._start.isBefore(this._end);
            this._direction = isForward ? RangeDirection.FORWARD : RangeDirection.BACKWARD;
        }
        return this._direction;
    }
    /**
     * Collapse the range. Return self.
     *
     * @param [edge] edge on which to collapse ('start' or 'end')
     *               default: 'start'
     */
    collapse(edge: 'start' | 'end' = 'start'): VRange {
        if (edge === 'start') {
            this.setEnd(this._start);
        } else {
            this.setStart(this._end);
        }
        // When collapsing, we always set the end after the start
        this._direction = RangeDirection.FORWARD;
        return this;
    }
    /**
     * Move the range to the given location. If no end location is given,
     * collapse on the start location. A location is given by targetting a
     * reference VNode and specifying the position in reference to that VNode
     * ('BEFORE', 'AFTER'), like in an `xpath`. Return self.
     *
     * @param start
     * @param [end]
     */
    set(location: VRangeLocation): VRange {
        if (location.direction === RangeDirection.FORWARD) {
            this.select(location.start, location.startPosition, location.end, location.endPosition);
        } else {
            this.select(location.end, location.endPosition, location.start, location.startPosition);
        }
        if (location.direction) {
            this._direction = location.direction;
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
        const methodName = position === RelativePosition.BEFORE ? 'before' : 'after';
        reference.firstLeaf[methodName](this._start);
        this._direction = null; // Invalidate range direction cache
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
    setEnd(reference: VNode, position = RelativePosition.AFTER): VRange {
        const methodName = position === RelativePosition.BEFORE ? 'before' : 'after';
        reference.lastLeaf[methodName](this._end);
        this._direction = null; // Invalidate range direction cache
        return this;
    }
}
