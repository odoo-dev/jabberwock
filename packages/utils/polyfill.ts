import { CaretPosition } from '../core/src/EventNormalizer';
import { targetDeepest } from './src/Dom';

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

    const [offsetNode, offset] = targetDeepest(caretPosition.offsetNode, caretPosition.offset);
    return { offsetNode, offset };
}
