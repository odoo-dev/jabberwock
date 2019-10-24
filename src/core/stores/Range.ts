type Direction = 'ltr' | 'rtl';
export interface Range {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
    direction: Direction;
}
