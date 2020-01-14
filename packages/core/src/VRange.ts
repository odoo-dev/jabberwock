import { VNode, Predicate, Constructor, NodePredicate } from './VNodes/VNode';
import { RelativePosition, Direction, withMarkers } from '../../utils/src/range';
import { RangeNode } from './VNodes/RangeNode';

export interface VRangeDescription {
    start: VNode;
    startPosition?: RelativePosition;
    end?: VNode;
    endPosition?: RelativePosition;
    direction: Direction;
}

export class VRange {
    readonly _tail = new RangeNode();
    readonly _head = new RangeNode();
    /**
     * The direction of the range depends on whether tail is before head or the
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
            const forward = withMarkers(() => this._tail.isBefore(this._head));
            this._direction = forward ? Direction.FORWARD : Direction.BACKWARD;
        }
        return this._direction;
    }
    /**
     * Return the first range node in order of traversal.
     */
    get start(): RangeNode {
        return this.direction === Direction.FORWARD ? this._tail : this._head;
    }
    /**
     * Return the last range node in order of traversal.
     */
    get end(): RangeNode {
        return this.direction === Direction.FORWARD ? this._head : this._tail;
    }
    /**
     * Return the anchor range node: the one on which the selection was
     * initiated.
     */
    get anchor(): VNode {
        return this._tail;
    }
    /**
     * Return the focus range node: the one to which the selection was extended.
     */
    get focus(): VNode {
        return this._head;
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
                return this._tail.nextSibling() === this._head;
            } else {
                return this._head.nextSibling() === this._tail;
            }
        });
    }
    /**
     * Return a list of all the nodes implied in the selection between the first
     * range node to the last (non-included).
     */
    selectedNodes<T extends VNode>(predicate?: Constructor<T>): T[];
    selectedNodes(predicate?: Predicate): VNode[];
    selectedNodes<T extends VNode>(predicate?: NodePredicate<T>): VNode[] {
        const selectedNodes: VNode[] = [];
        let node = this.start;
        withMarkers(() => {
            while ((node = node.next()) && node !== this.end) {
                if (node.test(predicate)) {
                    selectedNodes.push(node);
                }
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
    collapse(edge = this._tail): VRange {
        if (edge === this._tail) {
            this._setHead(edge);
        } else {
            this._setTail(edge);
        }
        // When collapsing, we always set the head after the tail
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
        return this._setTail(reference, position).collapse();
    }
    /**
     * Set a range selecting the given nodes.
     * Consider `ab` ([ = `this._start`, ] = `this._end`):
     * `select(a)` => `[a]b`
     * `select(a, b)` => `[ab]`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.BEFORE)` => `[a]b`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.BEFORE)` => `a[]b`
     * `select(a, RelativePosition.BEFORE, b, RelativePosition.AFTER)` => `[ab]`
     * `select(a, RelativePosition.AFTER, b, RelativePosition.AFTER)` => `a[b]`
     *
     * @param tailNode
     * @param [startPosition] default: `RelativePosition.BEFORE`
     * @param [headNode] default: `startNode`
     * @param [endPosition] default: `RelativePosition.AFTER`
     */
    select(tailNode: VNode, headNode?: VNode): VRange;
    select(
        tailNode: VNode,
        tailPosition: RelativePosition,
        headNode: VNode,
        headPosition: RelativePosition,
    ): VRange;
    select(
        tailNode: VNode,
        tailPosition: RelativePosition | VNode = RelativePosition.BEFORE,
        headNode: VNode = tailNode,
        headPosition: RelativePosition = RelativePosition.AFTER,
    ): VRange {
        if (tailPosition instanceof VNode) {
            headNode = tailPosition;
            tailPosition = RelativePosition.BEFORE;
        }
        if (headPosition === RelativePosition.AFTER) {
            this._setHead(headNode, headPosition);
            this._setTail(tailNode, tailPosition);
        } else {
            this._setTail(tailNode, tailPosition);
            this._setHead(headNode, headPosition);
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
            return this._setTail(reference, position);
        } else {
            return this._setHead(reference, position);
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
            return this._setHead(reference, position);
        } else {
            return this._setTail(reference, position);
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
        return this._setTail(reference, position);
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
        return this._setHead(reference, position);
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
            this._setHead(reference, position);
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
    _setTail(reference: VNode, position = RelativePosition.BEFORE): VRange {
        reference = reference.firstLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.prepend(this._tail);
        } else if (position === RelativePosition.AFTER && reference !== this._head) {
            // We check that `reference` isn't `_head` to avoid a backward
            // collapsed range.
            reference.after(this._tail);
        } else {
            reference.before(this._tail);
        }
        this._direction = null; // Invalidate range direction cache.
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
    _setHead(reference: VNode, position = RelativePosition.AFTER): VRange {
        reference = reference.lastLeaf();
        if (!reference.hasChildren() && !reference.atomic) {
            reference.append(this._head);
        } else if (position === RelativePosition.BEFORE && reference !== this._tail) {
            // We check that `reference` isn't `_tail` to avoid a backward
            // collapsed range.
            reference.before(this._head);
        } else {
            reference.after(this._head);
        }
        this._direction = null; // Invalidate range direction cache.
        return this;
    }
}
