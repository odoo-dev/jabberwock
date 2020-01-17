import { JWPlugin } from './JWPlugin';
import JWEditor from './JWEditor';
import { VNode, RelativePosition } from './VNodes/VNode';
import { VRange } from './VRange';

export interface RangeParams {
    range?: VRange;
}

export type InsertParagraphBreakParams = RangeParams;
export type DeleteBackwardParams = RangeParams;
export type DeleteForwardParams = RangeParams;

export interface InsertParams extends RangeParams {
    node: VNode;
}
export interface InsertTextParams extends RangeParams {
    text: string;
}
export interface SetSelectionParams {
    anchorNode: VNode;
    anchorPosition?: RelativePosition;
    focusNode?: VNode;
    focusPosition?: RelativePosition;
}
export interface FormatParams extends RangeParams {
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
        setSelection: {
            handler: this.setSelection.bind(this),
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
    insertParagraphBreak(params: InsertParagraphBreakParams): void {
        this.editor.vDocument.insertParagraphBreak(params.range);
    }
    /**
     * Insert a VNode at the current position of the selection.
     *
     * @param params
     */
    insert(params: InsertParams): void {
        this.editor.vDocument.insert(params.node, params.range);
    }
    /**
     * Insert text at the current position of the selection.
     *
     * @param params
     */
    insertText(params: InsertTextParams): void {
        this.editor.vDocument.insertText(params.text, params.range);
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
    deleteBackward(params: DeleteForwardParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            const previous = range.start.previous();
            if (previous) {
                range.extendTo(previous);
            }
        }
        this.editor.vDocument.deleteSelection(range);
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(params: DeleteForwardParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            const next = range.end.next();
            if (next) {
                range.extendTo(next);
            }
        }
        this.editor.vDocument.deleteSelection(range);
    }
    /**
     * Update the selection of the document to match the one in given params.
     *
     * @param params
     */
    setSelection(params: SetSelectionParams): void {
        this.editor.vDocument.setSelection(
            params.anchorNode,
            params.anchorPosition,
            params.focusNode,
            params.focusPosition,
        );
    }

    /**
     * Update the selection in such a way that it selects the entire document.
     *
     * @param params
     */
    selectAll(): void {
        this.editor.vDocument.setSelection(
            this.editor.vDocument.root.firstLeaf(),
            RelativePosition.BEFORE,
            this.editor.vDocument.root.lastLeaf(),
            RelativePosition.AFTER,
        );
    }
}
