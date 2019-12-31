import { JWPlugin } from './JWPlugin';
import JWEditor from './JWEditor';
import { VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';

export interface InsertParams {
    value: VNode;
}
export interface InsertTextParams {
    value: string;
}
export interface VSelectionParams {
    vSelection: VSelectionDescription;
}
export interface FormatParams {
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
    insertParagraphBreak(): void {
        this.editor.vDocument.insertParagraphBreak();
    }
    /**
     * Insert a VNode at the current position of the selection.
     *
     * @param params
     */
    insert(params: InsertParams): void {
        this.editor.vDocument.insert(params.value);
    }
    /**
     * Insert text at the current position of the selection.
     *
     * @param params
     */
    insertText(params: InsertTextParams): void {
        this.editor.vDocument.insertText(params.value);
    }
    /**
     * Command to apply the format.
     */
    applyFormat(params: FormatParams): void {
        this.editor.vDocument.applyFormat(params.format);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(): void {
        const range = this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            const previous = range.start.previous();
            if (previous) {
                range.extendTo(previous);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(): void {
        const range = this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            const next = range.end.next();
            if (next) {
                range.extendTo(next);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Navigate to a given range.
     *
     * @param params
     */
    setSelection(params: VSelectionParams): void {
        this.editor.vDocument.selection.set(params.vSelection);
        // Each time the selection changes, we reset its format.
        this.editor.vDocument.formatCache = null;
    }

    /**
     * Update the selection in such a way that it selects the entire document.
     *
     * @param params
     */
    selectAll(params: VSelectionParams): void {
        this.editor.vDocument.selection.set({
            anchorNode: this.editor.vDocument.root.firstLeaf(),
            anchorPosition: RelativePosition.BEFORE,
            focusNode: this.editor.vDocument.root.lastLeaf(),
            focusPosition: RelativePosition.AFTER,
            direction: params.vSelection.direction,
        });
    }
}
