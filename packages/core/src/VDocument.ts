import { VNode, VNodeType, FormatType, FORMAT_TYPES } from './VNode';
import { VRange, Direction, RangePosition } from './VRange';
import { isChar } from '../../utils/src/Predicates';
import { RangeFromTo } from './CorePlugin';

export let withRange = false;

export class VDocument {
    root: VNode;
    range = new VRange();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: FormatType = null;

    constructor(root: VNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------
    /**
     * Execute a callback with a specified or unspecified range.
     *
     * 1. If `rangeParam` is unspecified, the callback will uses the current vDocument range
     * (i.e. `vDocument.range`).
     *
     * 2. If `rangeParam` is of type `Range`, execute the callback with that range.
     *
     * 3. If `rangeParam` is of type `RangeFromTo`:
     *     1. Create a fake range
     *     2. Execute the callback with that fake range as argument
     *     3. Remove the fake range from the vDocument once the callback terminate to be
     *        garbage collected.
     */
    async withCustomRange(
        rangeParam: VRange | RangeFromTo | null,
        callback: (range: VRange) => void,
    ): Promise<void> {
        if (rangeParam instanceof VRange) {
            callback(rangeParam);
        } else if (rangeParam === null || rangeParam === undefined) {
            callback(this.range);
        } else {
            const rangeFromTo: RangeFromTo = { ...rangeParam };
            if (!rangeFromTo.end) {
                rangeFromTo.end = rangeFromTo.start;
            }

            // 3.1. Create fake range.
            const fakeRange = new VRange(Direction.FORWARD);
            if (rangeFromTo.startPosition && rangeFromTo.startPosition === RangePosition.AFTER) {
                rangeFromTo.start.after(fakeRange.start);
            } else {
                rangeFromTo.start.before(fakeRange.start);
            }
            if (rangeFromTo.endPosition && rangeFromTo.endPosition === RangePosition.AFTER) {
                rangeFromTo.end.after(fakeRange.end);
            } else {
                rangeFromTo.end.before(fakeRange.end);
            }

            // 3.2. Execute the callback with that fake range as argument.
            await callback(fakeRange);

            // 3.3. Remove the fake range from the vDocument to be garbage collected.
            fakeRange.start.remove();
            fakeRange.end.remove();
        }
    }
    /**
     * Insert a paragraph break.
     * @param [rangeFromTo] The range to use. If not specified, uses current vDocument range.
     */
    insertParagraphBreak(rangeFromTo?: RangeFromTo): void {
        this.withCustomRange(rangeFromTo, (range: VRange) => {
            // Remove the contents of the selection if needed.
            if (!range.isCollapsed()) {
                this.deleteSelection(range);
            }
            range.start.parent.splitAt(range.start);
        });
    }
    /**
     * Insert something at range.
     *
     * @param node
     * @param [rangeFromTo] The range to use. If not specified, uses current vDocument range.
     */
    insert(node: VNode, rangeFromTo?: RangeFromTo): void {
        this.withCustomRange(rangeFromTo, (range: VRange) => {
            // Remove the contents of the selection if needed.
            if (!range.isCollapsed()) {
                this.deleteSelection(range);
            }
            range.start.before(node);
        });
    }
    /**
     * Insert text at range.
     *
     * If the range is collapsed, add `text` to the vDocument and copy the formating of the
     * previous char or the next char.
     *
     * If the range is not collapsed, replace the text with the formating that was present in the
     * range.
     *
     * @param text
     * @param [rangeFromTo] The range to use. If not specified, uses current vDocument range.
     */
    insertText(text: string, rangeFromTo?: RangeFromTo): void {
        this.withCustomRange(rangeFromTo, range => {
            const format = this._getCurrentFormat(range);
            if (!range.isCollapsed()) {
                // Remove the contents of the selection if needed.
                this.deleteSelection(range);
            }
            // Split the text into CHAR nodes and insert them at the range.
            const characters = text.split('');
            characters.forEach(char => {
                const vNode = new VNode(VNodeType.CHAR, '#text', char, format);
                range.start.before(vNode);
            });
            if (range === this.range) {
                this.formatCache = null;
            }
        });
    }

    /**
     * Get the format for the next insertion.
     *
     * @param range The range to format.
     */
    _getCurrentFormat(range: VRange): FormatType {
        let format: FormatType = {};
        if (this.formatCache) {
            return this.formatCache;
        } else if (range.isCollapsed()) {
            const charToCopyFormat = range.start.previousSibling(isChar) ||
                range.start.nextSibling(isChar) || {
                    format: {},
                };
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = range.selectedNodes.filter(isChar);
            FORMAT_TYPES.forEach(formatName => {
                format[formatName] = selectedChars.some(char => char.format[formatName]);
            });
        }
        return format;
    }

    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     *
     * @param range The range to format.
     */
    deleteSelection(range: VRange): void {
        VDocument.withRange(() => {
            // Filter out the range nodes because we never want to remove
            // a range node from a selection.
            const nodes = range.selectedNodes.filter(
                node => node.type !== VNodeType.RANGE_TAIL && node.type !== VNodeType.RANGE_HEAD,
            );
            if (!nodes.length) return;
            range.collapse(range.start); // Reset the direction of the range.
            let reference = range.end;
            nodes.forEach(vNode => {
                // If the node has children, merge it with the container of the
                // range. Children of the merged node that should be truncated
                // as well will be deleted in the following iterations since
                // they appear in `nodes`. The children array must be cloned in
                // order to modify it while iterating.
                // TODO: test whether the node can be merged with the container.
                if (vNode.hasChildren()) {
                    vNode.children.slice().forEach(child => {
                        reference.after(child);
                        reference = child;
                    });
                }
            });
            // Then remove.
            nodes.forEach(vNode => vNode.remove());
        });
    }

    //--------------------------------------------------------------------------
    // Context
    //--------------------------------------------------------------------------

    /**
     * Call a callback on this VNode without ignoring the range nodes.
     *
     * @param callback
     */
    static withRange<T>(callback: () => T): T {
        // Record the previous value to allow for nested calls to `withRange`.
        const previousValue = withRange;
        withRange = true;
        const result = callback();
        withRange = previousValue;
        return result;
    }

    /**
     * Apply the `format` to the range.
     *
     * If the range is collapsed, set the format on the range so we know in the next insert
     * which format should be used.
     *
     * @param formatName The name of the format to use. (e. g. 'bold', 'italic', 'underline')
     * @param [rangeFromTo] The range to use. If not specified, uses current vDocument range.
     */
    applyFormat(formatName: string, rangeFromTo?: RangeFromTo): void {
        this.withCustomRange(rangeFromTo, (range: VRange) => {
            if (range.isCollapsed()) {
                if (!this.formatCache) {
                    this.formatCache = this._getCurrentFormat(range);
                }
                this.formatCache[formatName] = !this.formatCache[formatName];
            } else {
                const selectedChars = range.selectedNodes.filter(isChar);

                // If there is no char with the format `formatName` in the range, set the format to true
                // for all nodes.
                if (!selectedChars.every(char => char.format[formatName])) {
                    selectedChars.forEach(char => {
                        char.format[formatName] = true;
                    });
                    // If there is at least one char in with the format `fomatName` in the range, set the
                    // format to false for all nodes.
                } else {
                    selectedChars.forEach(char => {
                        char.format[formatName] = false;
                    });
                }
            }
        });
    }
}
