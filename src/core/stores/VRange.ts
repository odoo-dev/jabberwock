import { VNode } from './VNode';

export type Direction = 'forward' | 'backward';
export interface VRange {
    startContainer: VNode;
    startOffset: number;
    endContainer: VNode;
    endOffset: number;
    direction: Direction;
}

export class VRangeStore {
    startContainer: VNode;
    startOffset: number;
    endContainer: VNode;
    endOffset: number;
    direction: Direction;

    get(): VRange {
        return {
            startContainer: this.startContainer,
            startOffset: this.startOffset,
            endContainer: this.endContainer,
            endOffset: this.endOffset,
            direction: this.direction,
        };
    }
    set(range: VRange): void {
        this.startContainer = range.startContainer;
        this.startOffset = range.startOffset;
        this.endContainer = range.endContainer;
        this.endOffset = range.endOffset;
        this.direction = range.direction;
    }
}
