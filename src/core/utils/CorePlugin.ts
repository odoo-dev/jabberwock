import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeDescription, RelativePosition } from '../stores/VRange';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            insert: 'insert',
            remove: 'onRemoveIntent', // names are just to show relationships here
            setRange: 'navigate',
            selectAll: 'selectAll',
        },
    };
    commands = {
        insert: this.insert.bind(this),
        navigate: this.navigate.bind(this),
        onRemoveIntent: this.removeSide,
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
    insert(intent: Intent): void {
        // TODO: check the intent to insert other things than text.
        this.editor.vDocument.insertText(intent.payload['value']);
    }
    removeSide(intent: Intent): void {
        console.log('REMOVE SIDE:' + intent);
    }
    /**
     * Navigate to a given Range (in the payload of the Intent).
     *
     * @param intent
     */
    navigate(intent: Intent): void {
        const range: VRangeDescription = intent.payload['vRange'];
        this.editor.vDocument.range.set(range);
    }

    /**
     * Update the range such that it selects the entire document.
     *
     * @param intent
     */
    selectAll(intent: Intent): void {
        this.editor.vDocument.range.set({
            start: this.editor.vDocument.root.firstLeaf(),
            startPosition: RelativePosition.BEFORE,
            end: this.editor.vDocument.root.lastLeaf(),
            endPosition: RelativePosition.AFTER,
            direction: intent.payload['vRange'].direction,
        });
    }
}
