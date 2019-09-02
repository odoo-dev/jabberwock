type Direction = 'ltr' | 'rtl';
export interface Range {
    startContainer: any;
    startOffset: number;
    endContainer: any;
    endOffset: number;
    direction: Direction;
}
