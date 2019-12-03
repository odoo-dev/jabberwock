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
