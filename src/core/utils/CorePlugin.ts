import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { VRangeLocation, RangeDirection, RelativePosition, VRange } from '../stores/VRange';
import { VNode, VNodeType } from '../stores/VNode';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    range: VRange;
    handlers = {
        intents: {
            enter: 'enter',
            insert: 'insert',
            remove: 'remove',
            render: 'render',
            selectAll: 'navigate',
            setRange: 'navigate',
        },
    };
    commands = {
        enter: this.enter.bind(this),
        insert: this.insert.bind(this),
        navigate: this.navigate.bind(this),
        remove: this.removeSide.bind(this),
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
     * Handle the (shift+) enter key.
     *
     * @param intent
     */
    enter(intent: Intent): void {
        if (intent.payload['shiftKey']) {
            this.editor.vDocument.insert(new VNode(VNodeType.LINE_BREAK));
        } else {
            this.editor.vDocument.enter();
        }
    }
    /**
     * Insert something at range.
     *
     * @param intent
     */
    insert(intent: Intent): void {
        this.editor.vDocument.insert(intent.payload['value']);
    }
    /**
     * Remove at range, in the given direction, or remove the selection if there
     * is one.
     *
     * @param intent
     */
    removeSide(intent: Intent): void {
        this.editor.vDocument.removeSide(intent.payload['direction']);
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
        if (range.direction === RangeDirection.FORWARD) {
            this.range.move(range.start, range.end);
        } else {
            this.range.move(range.end, range.start);
        }
        this.range.setDirection(range.direction);
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
