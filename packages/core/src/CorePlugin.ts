import { JWPlugin } from './JWPlugin';
import JWEditor from './JWEditor';
import { VRangeDescription, Direction, RelativePosition, RangePosition } from './VRange';
import { VNode } from './VNode';

export interface RangeFromTo {
    start: VNode;
    startPosition?: RangePosition;
    end?: VNode;
    endPosition?: RangePosition;
}
export interface OptionalRangeParams {
    range?: RangeFromTo;
}
export interface InsertParams extends OptionalRangeParams {
    value: VNode;
}
export interface InsertTextParams extends OptionalRangeParams {
    value: string;
}
export interface VRangeParams {
    vRange: VRangeDescription;
}
export interface FormatParams extends OptionalRangeParams {
    format: 'bold' | 'italic' | 'underline';
}

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    commands = {
        insert: {
            handler: this.insert.bind(this),
        },
        insertParagraphBreak: {
            handler: this.insertParagraphBreak.bind(this),
        },
        insertText: {
            handler: this.insertText.bind(this),
        },
        setRange: {
            handler: this.setRange.bind(this),
        },
        deleteBackward: {
            handler: this.deleteBackward.bind(this),
        },
        deleteForward: {
            handler: this.deleteForward.bind(this),
        },
        selectAll: {
            handler: this.selectAll.bind(this),
        },
        applyFormat: {
            handler: this.applyFormat.bind(this),
        },
    };
    constructor(editor) {
        super(editor.dispatcher);
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(optionalRangeParams: OptionalRangeParams): void {
        this.editor.vDocument.insertParagraphBreak(optionalRangeParams.range);
    }
    /**
     * Insert a VNode at range.
     *
     * @param params
     */
    insert(params: InsertParams): void {
        this.editor.vDocument.insert(params.value, params.range);
    }
    /**
     * Insert text at range.
     *
     * @param params
     */
    insertText(params: InsertTextParams): void {
        this.editor.vDocument.insertText(params.value, params.range);
    }
    /**
     * Command to apply the format.
     */
    applyFormat(params: FormatParams): void {
        this.editor.vDocument.applyFormat(params.format, params.range);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(optionalRangeParams: OptionalRangeParams): void {
        this.editor.vDocument.withCustomRange(optionalRangeParams.range, range => {
            if (range.isCollapsed()) {
                const previous = range.start.previous();
                if (previous) {
                    range.extendTo(previous, Direction.BACKWARD);
                }
            }
            this.editor.vDocument.deleteSelection(range);
        });
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(optionalRangeParams: OptionalRangeParams): void {
        this.editor.vDocument.withCustomRange(optionalRangeParams.range, range => {
            if (range.isCollapsed()) {
                const next = range.end.next();
                if (next) {
                    range.extendTo(next, Direction.FORWARD);
                }
            }
            this.editor.vDocument.deleteSelection(range);
        });
    }
    /**
     * Navigate to a given range.
     *
     * @param params
     */
    setRange(params: VRangeParams): void {
        this.editor.vDocument.range.set(params.vRange);
        // Each time the range changes, we reset its format.
        this.editor.vDocument.formatCache = null;
    }

    /**
     * Update the range such that it selects the entire document.
     *
     * @param params
     */
    selectAll(params: VRangeParams): void {
        this.editor.vDocument.range.set({
            start: this.editor.vDocument.root.firstLeaf(),
            startPosition: RelativePosition.BEFORE,
            end: this.editor.vDocument.root.lastLeaf(),
            endPosition: RelativePosition.AFTER,
            direction: params.vRange.direction,
        });
    }
}
