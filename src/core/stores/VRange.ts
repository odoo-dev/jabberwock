import { VNode, VNodeType } from './VNode';

export enum RangeDirection {
    BACKWARD = 'BACKWARD',
    FORWARD = 'FORWARD',
}
export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}
export interface TargetLocation {
    reference: VNode;
    relativePosition: RelativePosition;
}
export interface VRangeLocation {
    start: TargetLocation;
    end: TargetLocation;
    direction: RangeDirection;
}

export class VRange {
    readonly _start = new VNode(VNodeType.RANGE_START);
    readonly _end = new VNode(VNodeType.RANGE_END);
    direction: RangeDirection;
    constructor(direction: RangeDirection = RangeDirection.FORWARD) {
        this.direction = direction;
    }
    /**
     * Collapse the range. Return self.
     *
     * @param [onEnd] true to collapse on the end range
     */
    collapse(onEnd = false): VRange {
        if (onEnd) {
            return this.setStart(RelativePosition.BEFORE, this._end);
        } else {
            return this.setEnd(RelativePosition.AFTER, this._start);
        }
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
    move(start: TargetLocation, end?: TargetLocation): VRange {
        this.setStart(start.relativePosition, start.reference);
        const sameReferences = !end || end.reference.id === start.reference.id;
        const samePositions = !end || end.relativePosition === start.relativePosition;
        if (sameReferences && samePositions) {
            return this.collapse();
        } else {
            return this.setEnd(end.relativePosition, end.reference);
        }
    }
    /**
     * Change the range's direction (forward or backward). Return self.
     *
     * @param direction
     */
    setDirection(direction: RangeDirection): VRange {
        this.direction = direction;
        return this;
    }
    /**
     * Set the start of the range by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. Return self.
     *
     * @param position
     * @param reference
     */
    setStart(position: RelativePosition, reference: VNode): VRange {
        const methodName = position === RelativePosition.BEFORE ? 'before' : 'after';
        reference[methodName](this._start);
        return this;
    }
    /**
     * Set the start of the range by targetting a `reference` VNode and
     * specifying the `position` in reference to that VNode ('BEFORE', 'AFTER'),
     * like in an `xpath`. Return self.
     *
     * @param position
     * @param reference
     */
    setEnd(position: RelativePosition, reference: VNode): VRange {
        const methodName = position === RelativePosition.BEFORE ? 'before' : 'after';
        reference[methodName](this._end);
        return this;
    }
}
