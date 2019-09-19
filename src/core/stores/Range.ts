type Direction = 'ltr' | 'rtl';
export interface Range {
    startContainer: DOMElement;
    startOffset: number;
    endContainer: DOMElement;
    endOffset: number;
    direction: Direction;
}
