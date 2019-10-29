export function caretPositionFromPoint(x: number, y: number): { offsetNode: Node; offset: number } {
    let caretPosition: { offsetNode: Node; offset: number };
    if (document.caretPositionFromPoint) {
        caretPosition = document.caretPositionFromPoint(x, y);
    } else {
        const carretRange = document.caretRangeFromPoint(x, y);
        if (carretRange) {
            caretPosition = {
                offsetNode: carretRange.startContainer,
                offset: carretRange.startOffset,
            };
        }
    }
    if (!caretPosition) {
        return;
    }
    const subNode = caretPosition.offsetNode.childNodes[caretPosition.offset];
    if (subNode) {
        caretPosition = {
            offsetNode: subNode,
            offset: 0,
        };
    }
    return caretPosition;
}
