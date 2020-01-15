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
    _onNormalizedEvent(customEvent: CustomEvent): void {
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
            case 'keydown': {
                // TODO: keydown should be matched with existing shortcuts. If
                // it matches an command shortcut, trigger the corresponding
                // command, otherwise do not trigger any command.
                if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'b'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'bold' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'i'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'italic' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'u'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'underline' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === '7'
                ) {
                    return this.editor.execCommand('toggleList', { type: 'ordered' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === '8'
                ) {
                    return this.editor.execCommand('toggleList', { type: 'unordered' });
                }
                // TODO: keydown should be matched with existing shortcuts.
                return;
            }
            default:
                this.editor.execCommand(customEvent.type, payload);
        }
    }
}
