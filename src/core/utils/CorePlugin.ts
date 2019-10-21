import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeLocation, RangeDirection, RelativePosition, VRange } from '../stores/VRange';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    range: VRange;
    handlers = {
        intents: {
            insert: 'insert',
            remove: 'onRemoveIntent', // names are just to show relationships here
            render: 'render',
            selectAll: 'navigate',
            setRange: 'navigate',
        },
    };
    commands = {
        insert: this.insert.bind(this),
        navigate: this.navigate.bind(this),
        onRemoveIntent: this.removeSide,
        render: this.render.bind(this),
    };
    constructor(editor) {
        super(editor.dispatcher);
        this.editor = editor;
        this.range = this.editor.vDocument.range;
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
        this.editor.vDocument.insert(intent.payload['value']);
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
        let range: VRangeLocation;
        if (intent.name === 'selectAll') {
            range = this._getRangeAll();
        } else {
            range = intent.payload['vRangeLocation'];
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
            start: this.editor.vDocument.root.firstLeaf,
            startPosition: RelativePosition.BEFORE,
            end: this.editor.vDocument.root.lastLeaf,
            endPosition: RelativePosition.AFTER,
            direction: RangeDirection.FORWARD,
        };
    }
}
