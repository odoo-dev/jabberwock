import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeLocation, RangeDirection, RelativePosition } from '../stores/VRange';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
            render: 'render',
            selectAll: 'navigate',
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
        let range: VRangeLocation;
        if (intent.name === 'selectAll') {
            range = this._getRangeAll();
        } else {
            range = intent.payload['vRangeToSet'];
        }
        this.editor.vDocument.range.set(range);
    }
    /**
     * Render the `vDocument`.
     */
    render(): void {
        this.editor.renderer.render(this.editor.vDocument.root, this.editor.editable);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _getRangeAll(): VRangeLocation {
        return {
            start: {
                reference: this.editor.vDocument.root.firstLeaf,
                relativePosition: RelativePosition.BEFORE,
            },
            end: {
                reference: this.editor.vDocument.root.lastLeaf,
                relativePosition: RelativePosition.AFTER,
            },
            direction: RangeDirection.FORWARD,
        };
    }
}
