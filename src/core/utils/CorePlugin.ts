import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { RelativePosition, VRangeDescription, Direction } from '../stores/VRange';
import { InsertIntent, RangeIntent } from '../types/Intents';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            insert: 'insert',
            removeBackward: 'removeBackward',
            removeForward: 'removeForward',
            setRange: 'navigate',
            selectAll: 'selectAll',
        },
    };
    commands = {
        insert: this.insert.bind(this),
        navigate: this.navigate.bind(this),
        removeBackward: this.removeBackward.bind(this),
        removeForward: this.removeForward.bind(this),
        selectAll: this.selectAll.bind(this),
    };
    constructor(editor) {
        super(editor.dispatcher);
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert something at range.
     *
     * @param intent
     */
    insert(intent: InsertIntent): void {
        // TODO: check the intent to insert other things than text.
        this.editor.vDocument.insertText(intent.payload.value);
    }
    removeBackward(): void {
        // TODO: this is a stub
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            const previous = range.start.previous();
            if (previous) {
                range.extendTo(previous, Direction.BACKWARD);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    removeForward(): void {
        // TODO: this is a stub
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
