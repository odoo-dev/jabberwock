import { VNode } from './VNode';

export class VRangeStore {
    startContainer: VNode;
    startOffset: number;
    endContainer: VNode;
    endOffset: number;
    direction: Direction;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get the current `VRange`.
     */
    get(): VRange {
        return {
            startContainer: this.startContainer,
            startOffset: this.startOffset,
            endContainer: this.endContainer,
            endOffset: this.endOffset,
            direction: this.direction,
        };
    }
    /**
     * Set a new `VRange`. Set `select` to false to not select the new `VRange`
     * in the DOM.
     *
     * @param {VRange} range
     * @param {boolean} [select] default: true
     */
    set(range: VRange, select = true): void {
        this.startContainer = range.startContainer;
        this.startOffset = range.startOffset;
        this.endContainer = range.endContainer;
        this.endOffset = range.endOffset;
        this.direction = range.direction;
        if (select) {
            this._select();
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Select the current range in the DOM.
     */
    _select(): void {
        const domRange: Range = document.createRange(); // todo: use editor doc
        domRange.setStart(this.startContainer.domMatch[0], this.startOffset);
        domRange.setEnd(this.endContainer.domMatch[0], this.endOffset);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
}
