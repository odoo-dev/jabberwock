type VNode = import('../stores/VNode').VNode;

type Direction = 'forward' | 'backward';
interface VRange {
    startContainer: VNode;
    startOffset: number;
    endContainer: VNode;
    endOffset: number;
    direction: Direction;
}
