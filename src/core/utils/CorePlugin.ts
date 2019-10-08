import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeLocation } from '../stores/VRange';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
            render: 'render',
            setRange: 'navigate',
        },
    };
    commands = {
        navigate: this.navigate.bind(this),
        onRemoveIntent: this.removeSide,
        render: this.render.bind(this),
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
        const range: VRangeLocation = intent.payload['vRangeLocation'];
        this.editor.vDocument.range.set(range);
    }
    /**
     * Render the `vDocument`.
     */
    render(): void {
        this.editor.renderer.render(this.editor.vDocument.root, this.editor.editable);
    }
}
