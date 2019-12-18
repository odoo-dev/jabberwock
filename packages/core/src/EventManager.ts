import { EventNormalizer, DomRangeDescription } from './EventNormalizer';
import JWEditor from './JWEditor';

interface SetRangeParams {
    domRange: DomRangeDescription;
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
            case 'setRange': {
                const rangeParams = payload as SetRangeParams;
                return this.editor.execCommand(customEvent.type, {
                    vRange: this.editor.parser.parseRange(rangeParams.domRange),
                });
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
                }
                // TODO: keydown should be matched with existing shortcuts.
                return;
            }
            default:
                this.editor.execCommand(customEvent.type, payload);
        }
    }
}
