type DomDirection = 'ltr' | 'rtl';
export interface Range {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
    direction: DomDirection;
}

export enum RelativePosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
    INSIDE = 'INSIDE',
}

export enum Direction {
    BACKWARD = 'BACKWARD',
    FORWARD = 'FORWARD',
}
export const RANGE_TAIL_CHAR = '[';
export const RANGE_HEAD_CHAR = ']';

export let isWithMarkers = false;
/**
 * Call a callback on this VNode without ignoring the range nodes.
 *
 * @param callback
 */
export function withMarkers<T>(callback: () => T): T {
    // Record the previous value to allow for nested calls to `withRange`.
    const previousValue = isWithMarkers;
    isWithMarkers = true;
    const result = callback();
    isWithMarkers = previousValue;
    return result;
}
