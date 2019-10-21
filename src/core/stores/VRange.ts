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

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the range is collapsed.
     */
    get collapsed(): boolean {
        if (this.direction === RangeDirection.FORWARD) {
            const nextStart = this._start.nextSibling;
            return nextStart && nextStart.id === this._end.id;
        } else {
            const nextEnd = this._end.nextSibling;
            return nextEnd && nextEnd.id === this._start.id;
        }
    }
    /**
     * Return the first range node, in a breadth-first pre-order of the tree.
     */
    get first(): VNode {
        if (this.direction === RangeDirection.FORWARD) {
            return this._start;
        } else {
            return this._end;
        }
    }
    /**
     * Return the last range node, in a breadth-first pre-order of the tree.
     */
    get last(): VNode {
        if (this.direction === RangeDirection.FORWARD) {
            return this._end;
        } else {
            return this._start;
        }
    }
    /**
     * Return a list of all the nodes implied in the selection between the first
     * range node to the last (non-included).
     */
    get selectedNodes(): VNode[] {
        const selectedNodes: VNode[] = [];
        this.first.nextUntil((next: VNode): boolean => {
            if (next.id === this.last.id) {
                return true;
            }
            selectedNodes.push(next);
        });
        return selectedNodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Collapse the range. Return self.
     *
     * @param [onEnd] true to collapse on the end range
     */
    collapse(onEnd = false): VRange {
        if (onEnd) {
            this.setStart(RelativePosition.BEFORE, this._end);
        } else {
            this.setEnd(RelativePosition.AFTER, this._start);
        }
        // A collapsed range is always considered a 'FORWARD' selection.
        return this.setDirection(RangeDirection.FORWARD);
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
