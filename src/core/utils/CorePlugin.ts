import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeDescription } from '../stores/VRange';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
            setRange: 'navigate',
        },
    };
    commands = {
        navigate: this.navigate.bind(this),
        onRemoveIntent: this.removeSide,
    };
    constructor(editor) {
        super(editor.dispatcher);
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
}
