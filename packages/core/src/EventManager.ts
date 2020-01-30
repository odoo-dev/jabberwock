import { EventNormalizer, DomSelectionDescription } from './EventNormalizer';
import JWEditor from './JWEditor';
import { VSelectionParams } from './CorePlugin';

interface SetSelectionParams {
    domSelection: DomSelectionDescription;
}

export class EventManager {
    editor: JWEditor;
    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.eventNormalizer = new EventNormalizer(
            editor.editable,
            this._onNormalizedEvent.bind(this),
        );
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Callback given to the normalizer.
     */
    async _onNormalizedEvent(customEvent: CustomEvent): Promise<void> {
        const payload = customEvent.detail;
        switch (customEvent.type) {
            case 'enter':
                if (customEvent.detail.shiftKey) {
                    return this.editor.execCommand('insertLineBreak');
                } else {
                    return this.editor.execCommand('insertParagraphBreak');
                }
            case 'selectAll':
            case 'setSelection': {
                const selectionParams = payload as SetSelectionParams;
                const vSelectionParams: VSelectionParams = {
                    vSelection: this.editor.parser.parseSelection(selectionParams.domSelection),
                };
                return this.editor.execCommand(customEvent.type, vSelectionParams);
            }
            default:
                return this.editor.execCommand(customEvent.type, payload);
        }
    }
}
