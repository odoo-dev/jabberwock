import { EventNormalizer } from './EventNormalizer';
import { LineBreakNode } from './VNodes/LineBreakNode';
import JWEditor from './JWEditor';
import { SetSelectionParams, InsertTextParams, InsertParams } from './CorePlugin';
import { withRange } from './VRange';

interface KeydownParams {
    key: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
}

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
        const eventType = customEvent.type;
        const payload = customEvent.detail;
        if (this._isKeydown(eventType, payload)) {
            this._onKeydown(payload);
        } else if (this._isEnter(eventType, payload)) {
            this._onEnter(payload);
        } else if (this._isInsertText(eventType, payload)) {
            this._onInsertText(payload);
        } else if (this._isSetSelection(eventType, payload)) {
            this._onSetSelection(payload);
        } else {
            this.editor.execCommand(customEvent.type, payload);
        }
    }

    _isKeydown(eventType: string, payload: {}): payload is KeydownParams {
        return payload && eventType === 'keydown';
    }

    _onKeydown(payload: KeydownParams): void {
        // TODO: keydown should be matched with existing shortcuts.
        if (
            payload.ctrlKey &&
            !payload.altKey &&
            !payload.shiftKey &&
            !payload.metaKey &&
            payload.key === 'b'
        ) {
            this.editor.execCommand('applyFormat', { format: 'bold' });
        } else if (
            payload.ctrlKey &&
            !payload.altKey &&
            !payload.shiftKey &&
            !payload.metaKey &&
            payload.key === 'i'
        ) {
            this.editor.execCommand('applyFormat', { format: 'italic' });
        } else if (
            payload.ctrlKey &&
            !payload.altKey &&
            !payload.shiftKey &&
            !payload.metaKey &&
            payload.key === 'u'
        ) {
            this.editor.execCommand('applyFormat', { format: 'underline' });
        }
    }

    _isEnter(eventType: string, payload: {}): payload is KeydownParams {
        return payload && eventType === 'enter';
    }

    _onEnter(payload: KeydownParams): void {
        if (payload.shiftKey) {
            const params: InsertParams = {
                node: new LineBreakNode(),
            };
            this.editor.execCommand('insert', params);
        } else {
            this.editor.execCommand('insertParagraphBreak');
        }
    }

    _isInsertText(eventType: string, payload: {}): payload is DomInsertTextParams {
        return payload && eventType === 'insertText';
    }

    _onInsertText(payload: DomInsertTextParams): void {
        const params: InsertTextParams = {
            text: payload.text,
        };
        if (payload.range) {
            const boundaries = this.editor.parser.parseRange(payload.range);
            withRange(boundaries, range => {
                params.range = range;
                this.editor.execCommand('insertText', params);
            });
        } else {
            this.editor.execCommand('insertText', params);
        }
    }

    _isSetSelection(eventType: string, payload: {}): payload is DomSetSelectionParams {
        return payload && eventType === 'setSelection';
    }

    _onSetSelection(payload: DomSetSelectionParams): void {
        const params: SetSelectionParams = {
            ...this.editor.parser.parseSelection(payload.domSelection),
        };
        this.editor.execCommand('setSelection', params);
    }
}
