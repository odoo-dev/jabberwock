import { JWPlugin } from './JWPlugin';
import JWEditor from './JWEditor';
import { VSelectionDescription } from './VSelection';
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

export interface VSelectionParams {
    vSelection: VSelectionDescription;
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
            // Basic case: remove the node directly preceding the range.
            const previousSibling = range.start.previousSibling();
            if (previousSibling) {
                previousSibling.removeBackward();
            } else {
                // Otherwise delete nodes between range and previous leaf.
                const previousLeaf = range.start.previousLeaf(node => {
                    return node !== range.start.parent;
                });
                if (previousLeaf) {
                    range.setStart(previousLeaf, RelativePosition.AFTER);
                    this.editor.vDocument.deleteSelection(range);
                }
            }
        } else {
            this.editor.vDocument.deleteSelection(range);
        }
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(params: DeleteForwardParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            // Basic case: remove the node directly following the range.
            const nextSibling = range.end.nextSibling();
            if (nextSibling) {
                nextSibling.removeForward();
            } else {
                // Otherwise delete nodes between range and next leaf.
                const nextLeaf = range.end.nextLeaf();
                if (nextLeaf) {
                    range.setEnd(nextLeaf, RelativePosition.BEFORE);
                    this.editor.vDocument.deleteSelection(range);
                }
            }
        } else {
            this.editor.vDocument.deleteSelection(range);
        }
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
