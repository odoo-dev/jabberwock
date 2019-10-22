import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { RelativePosition, VRangeDescription, Direction } from '../stores/VRange';
import { InsertTextIntent, RangeIntent, FormatIntent, InsertIntent } from '../types/Intents';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            insertParagraphBreak: 'insertParagraphBreak',
            insert: 'insert',
            insertText: 'insertText',
            deleteBackward: 'deleteBackward',
            deleteForward: 'deleteForward',
            setRange: 'navigate',
            selectAll: 'selectAll',
            applyFormat: 'applyFormat',
        },
    };
    commands = {
        deleteBackward: this.deleteBackward.bind(this),
        deleteForward: this.deleteForward.bind(this),
        insertParagraphBreak: this.insertParagraphBreak.bind(this),
        insert: this.insert.bind(this),
        insertText: this.insertText.bind(this),
        navigate: this.navigate.bind(this),
        selectAll: this.selectAll.bind(this),
        applyFormat: this.applyFormat.bind(this),
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
     * Insert a VNode at range.
     *
     * @param intent
     */
    insert(intent: InsertIntent): void {
        this.editor.vDocument.insert(intent.payload.value);
    }
    /**
     * Insert text at range.
     *
     * @param intent
     */
    insertText(intent: InsertTextIntent): void {
        this.editor.vDocument.insertText(intent.payload.value);
    }
    /**
     * Command to apply the format.
     */
    applyFormat(intent: FormatIntent): void {
        this.editor.vDocument.applyFormat(intent.payload.format);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(): void {
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            const previous = range.start.previous();
            if (previous) {
                range.extendTo(previous, Direction.BACKWARD);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(): void {
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            const next = range.end.next();
            if (next) {
                range.extendTo(next, Direction.FORWARD);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Navigate to a given Range (in the payload of the Intent).
     *
     * @param intent
     */
    navigate(intent: RangeIntent): void {
        const range: VRangeDescription = intent.payload.vRange;
        this.editor.vDocument.range.set(range);
        // Each time the range changes, we reset its format.
        this.editor.vDocument.formatCache = null;
    }

    /**
     * Update the range such that it selects the entire document.
     *
     * @param intent
     */
    selectAll(intent: RangeIntent): void {
        this.editor.vDocument.range.set({
            start: this.editor.vDocument.root.firstLeaf(),
            startPosition: RelativePosition.BEFORE,
            end: this.editor.vDocument.root.lastLeaf(),
            endPosition: RelativePosition.AFTER,
            direction: intent.payload.vRange.direction,
        });
    }
}
