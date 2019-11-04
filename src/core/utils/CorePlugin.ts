import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { RelativePosition, VRangeDescription } from '../stores/VRange';

// Specialized intents
// Insert
interface InsertPayload extends ActionPayload {
    value: string;
}
interface InsertIntent extends Intent {
    payload: InsertPayload;
}
// Range
interface RangePayload extends ActionPayload {
    vRange: VRangeDescription;
}
interface RangeIntent extends Intent {
    payload: RangePayload;
}

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
            range.setStart(range.start.previous());
        }
        this.editor.vDocument.truncate(range.selectedNodes);
    }
    removeForward(): void {
        // TODO: this is a stub
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            range.setEnd(range.end.next());
        }
        this.editor.vDocument.truncate(range.selectedNodes);
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
