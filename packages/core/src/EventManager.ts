import { EventNormalizer, DomSelectionDescription } from './EventNormalizer';
import JWEditor from './JWEditor';
import { VSelectionParams } from './CorePlugin';
import { Dom } from '../../plugin-dom/src/Dom';

interface SetSelectionParams {
    domSelection: DomSelectionDescription;
}

export class EventManager {
    editor: JWEditor;
    domPlugin: Dom;
    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, domPlugin: Dom) {
        this.editor = editor;
        this.domPlugin = domPlugin;
        this.eventNormalizer = new EventNormalizer(
            domPlugin.editable,
            this._onNormalizedEvent.bind(this),
        );
    }
    stop(): void {
        this.eventNormalizer.destroy();
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
            case 'tab':
                if (customEvent.detail.shiftKey) {
                    return this.editor.execCommand('outdent');
                } else {
                    return this.editor.execCommand('indent');
                }
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
                    vSelection: this.domPlugin.parseSelection(selectionParams.domSelection),
                };
                return this.editor.execCommand(customEvent.type, vSelectionParams);
            }
            default:
                return this.editor.execCommand(customEvent.type, payload);
        }
    }
}
