import { CaretPosition } from '../core/src/EventNormalizer';

export function caretPositionFromPoint(x: number, y: number): CaretPosition {
    if ((!x && x !== 0) || (!y && y !== 0)) return;

    // There is no cross-browser function for this, but the two functions below
    // cover all modern browsers.
    let caretPosition: CaretPosition;
    if (document.caretPositionFromPoint) {
        caretPosition = document.caretPositionFromPoint(x, y);
    } else {
        const carretRange = document.caretRangeFromPoint(x, y);
        caretPosition = {
            offsetNode: carretRange.startContainer,
            offset: carretRange.startOffset,
        };
    }

    // Target deepest node.
    let offsetNode = caretPosition.offsetNode;
    let offset = caretPosition.offset;
    while (offsetNode.hasChildNodes()) {
        if (offset >= offsetNode.childNodes.length) {
            offsetNode = offsetNode.lastChild;
            offset = offsetNode.childNodes.length - 1;
        } else {
            offsetNode = offsetNode.childNodes[offset];
            offset = 0;
        }
    }

    return { offsetNode, offset };
}
