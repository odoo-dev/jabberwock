import { EventNormalizer } from './EventNormalizer';
import { LineBreakNode } from './VNodes/LineBreakNode';
import JWEditor from './JWEditor';
import { VSelectionParams, InsertTextParams } from './CorePlugin';
import { withRange } from './VRange';

interface DomInsertTextParams {
    text: string;
    range: Range;
}

interface DomSetSelectionParams {
    domSelection: Selection;
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
                    return this.editor.execCommand('insert', { node: new LineBreakNode() });
                } else {
                    return this.editor.execCommand('insertParagraphBreak');
                }
            case 'insertText': {
                const params = payload as DomInsertTextParams;
                const insertTextParams: InsertTextParams = {
                    text: params.text,
                };
                if (params.range) {
                    const rangeBounds = this.editor.parser.parseRange(params.range);
                    return withRange(rangeBounds, range => {
                        insertTextParams.range = range;
                        return this.editor.execCommand(customEvent.type, insertTextParams);
                    });
                } else {
                    return this.editor.execCommand(customEvent.type, insertTextParams);
                }
            }
            case 'selectAll':
            case 'setSelection': {
                const selectionParams = payload as DomSetSelectionParams;
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
                }
                // TODO: keydown should be matched with existing shortcuts.
                return;
            }
            default:
                this.editor.execCommand(customEvent.type, payload);
        }
    }
}
